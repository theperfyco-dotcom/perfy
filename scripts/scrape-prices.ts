// scripts/scrape-prices.ts
// Live price scraper for AllBeauty and Lookfantastic.
// Seeds retailers, then scrapes prices for each fragrance in the DB.
//
// Usage:
//   npx tsx scripts/scrape-prices.ts
//   npx tsx scripts/scrape-prices.ts --dry-run
//   npx tsx scripts/scrape-prices.ts --limit=5
//   npx tsx scripts/scrape-prices.ts --slug=dior-sauvage-edt

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { load as loadHtml } from 'cheerio'

config({ path: '.env.local' })

// ── CLI flags ─────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const slugArg    = args.find(a => a.startsWith('--slug='))
const limitArg   = args.find(a => a.startsWith('--limit='))
const TARGET_SLUG = slugArg  ? slugArg.split('=')[1]              : undefined
const LIMIT       = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Retailers ─────────────────────────────────────────────────────────────────
// Includes every retailer this script seeds. Only AllBeauty + Lookfantastic
// are actually scraped; The Fragrance Shop is seeded so existing synthetic
// prices remain valid.

const RETAILERS = [
  { slug: 'allbeauty',          name: 'AllBeauty' },
  { slug: 'lookfantastic',      name: 'Lookfantastic' },
  { slug: 'the-fragrance-shop', name: 'The Fragrance Shop' },
] as const

type RetailerSlug = typeof RETAILERS[number]['slug']

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const UA = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'AppleWebKit/537.36 (KHTML, like Gecko)',
  'Chrome/124.0.0.0 Safari/537.36',
].join(' ')

async function getHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      UA,
        'Accept':          'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control':   'no-cache',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      console.warn(`    HTTP ${res.status} → ${url}`)
      return null
    }
    return await res.text()
  } catch (e: any) {
    console.warn(`    fetch error → ${url}: ${e.message}`)
    return null
  }
}

async function getJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      UA,
        'Accept':          'application/json',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      console.warn(`    HTTP ${res.status} → ${url}`)
      return null
    }
    return (await res.json()) as T
  } catch (e: any) {
    console.warn(`    fetch/json error → ${url}: ${e.message}`)
    return null
  }
}

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// ── Parsed price shape ────────────────────────────────────────────────────────

interface ParsedPrice {
  size_ml:       number
  price:         number
  affiliate_url: string
}

// ── Size extractor ────────────────────────────────────────────────────────────

function extractMl(text: string): number | null {
  const m = text.match(/(\d+)\s*ml/i)
  return m ? parseInt(m[1], 10) : null
}

// ── AllBeauty scraper (Shopify) ───────────────────────────────────────────────
// 1. Search page → first /products/{handle} link
// 2. GET /products/{handle}.js → Shopify variant JSON
// 3. Parse variant title for "NNml", price in pence → GBP

async function scrapeAllBeauty(brand: string, name: string): Promise<ParsedPrice[]> {
  const q          = encodeURIComponent(`${brand} ${name}`)
  const searchUrl  = `https://www.allbeauty.com/search?q=${q}`
  const searchHtml = await getHtml(searchUrl)
  if (!searchHtml) return []

  const $      = loadHtml(searchHtml)
  let handle: string | null = null

  $('a[href]').each((_, el) => {
    if (handle) return
    const href = $(el).attr('href') ?? ''
    // Must be a product link, not a collection/category link
    const m = href.match(/\/products\/([a-z0-9][a-z0-9-]+)(?:[?#/]|$)/i)
    if (m && !href.includes('/collections/')) handle = m[1]
  })

  if (!handle) {
    console.warn(`    AllBeauty: no product link for "${brand} ${name}"`)
    return []
  }

  // Shopify product JSON — structured, reliable
  interface ShopifyVariant { title: string; price: number; available: boolean }
  interface ShopifyProduct  { handle: string; variants: ShopifyVariant[] }

  const product = await getJson<ShopifyProduct>(
    `https://www.allbeauty.com/products/${handle}.js`
  )
  if (!product?.variants?.length) return []

  const affiliateBase = `https://www.allbeauty.com/products/${handle}?utm_source=perfy&utm_medium=affiliate`
  const results: ParsedPrice[] = []

  for (const v of product.variants) {
    if (!v.available) continue
    const size_ml = extractMl(v.title)
    if (!size_ml) continue
    // Shopify prices are integers in the minor currency unit (pence for GBP)
    const price = Number((v.price / 100).toFixed(2))
    if (price <= 0) continue
    results.push({ size_ml, price, affiliate_url: affiliateBase })
  }

  return results
}

// ── Lookfantastic scraper (THG platform) ─────────────────────────────────────
// THG search pages render some content server-side for SEO.
// Strategy:
//   1. Search page → first product URL (data-quicklook-url or plain links)
//   2. Product page → JSON-LD structured data (most reliable)
//   3. Fallback: .thg-price / price text near size variants

async function scrapeLookfantastic(brand: string, name: string): Promise<ParsedPrice[]> {
  const q          = encodeURIComponent(`${brand} ${name}`)
  const searchUrl  = `https://www.lookfantastic.com/search?q=${q}`
  const searchHtml = await getHtml(searchUrl)
  if (!searchHtml) return []

  const $          = loadHtml(searchHtml)
  let productUrl: string | null = null

  const EXCLUDE = /gift|subscription|beauty-?box|voucher/i

  // Strategy A: product-card wrappers with data-quicklook-url
  $('[data-quicklook-url]').each((_, el) => {
    if (productUrl) return
    const quicklook = $(el).attr('data-quicklook-url') ?? ''
    if (EXCLUDE.test(quicklook)) return
    // Find the canonical product link inside this card
    const link =
      $(el).find('a[href]').first().attr('href') ??
      $(el).closest('a[href]').attr('href')
    if (!link || EXCLUDE.test(link)) return
    productUrl = link.startsWith('http')
      ? link
      : `https://www.lookfantastic.com${link}`
  })

  // Strategy B: any anchor whose href looks like a product path
  if (!productUrl) {
    $('a[href]').each((_, el) => {
      if (productUrl) return
      const href = $(el).attr('href') ?? ''
      // THG product URLs end in .list or contain product identifiers
      if (!/\.list$|\/[a-z0-9-]+-\d{5,}/.test(href)) return
      if (EXCLUDE.test(href)) return
      productUrl = href.startsWith('http')
        ? href
        : `https://www.lookfantastic.com${href}`
    })
  }

  if (!productUrl) {
    console.warn(`    Lookfantastic: no product link for "${brand} ${name}"`)
    return []
  }

  const productHtml = await getHtml(productUrl)
  if (!productHtml) return []

  const $p          = loadHtml(productHtml)
  const affiliateUrl = `${productUrl}${productUrl.includes('?') ? '&' : '?'}utm_source=perfy&utm_medium=affiliate`
  const results: ParsedPrice[] = []

  // Pass 1: JSON-LD (most reliable — covers single + multi-variant products)
  $p('script[type="application/ld+json"]').each((_, el) => {
    if (results.length) return
    try {
      const raw  = $p(el).html() ?? '{}'
      const data = JSON.parse(raw)
      // JSON-LD can be a single object or an array
      const items: unknown[] = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const obj = item as Record<string, unknown>
        if (obj['@type'] !== 'Product') continue
        const offers = obj['offers'] as Record<string, unknown> | Record<string, unknown>[] | undefined
        if (!offers) continue
        const offerList = Array.isArray(offers) ? offers : [offers]
        for (const offer of offerList) {
          const priceRaw = offer['price'] ?? offer['lowPrice']
          if (!priceRaw) continue
          const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw))
          if (!isFinite(price) || price <= 0) continue
          // Try to extract size from offer name, sku, or description
          const sizeText = [offer['name'], offer['sku'], obj['name']]
            .filter(Boolean).join(' ')
          const size_ml = extractMl(String(sizeText))
          if (!size_ml) continue
          results.push({ size_ml, price, affiliate_url: affiliateUrl })
        }
      }
    } catch { /* malformed JSON-LD, skip */ }
  })

  // Pass 2: thg-price elements near size labels
  if (!results.length) {
    $p('[class*="Price"], [data-test-id*="price"], .thg-price').each((_, el) => {
      const priceText = $p(el).text().trim()
      const priceMatch = priceText.match(/£([\d,]+(?:\.\d{2})?)/)
      if (!priceMatch) return
      const price = parseFloat(priceMatch[1].replace(',', ''))
      if (!isFinite(price) || price <= 0) return
      // Walk up to find a container that might mention the size
      const container = $p(el).closest('li, [class*="variant"], [class*="option"], [class*="size"]')
      const size_ml = extractMl(container.text())
      if (!size_ml) return
      results.push({ size_ml, price, affiliate_url: affiliateUrl })
    })
  }

  // Pass 3: look for size+price pairs anywhere on the page (last resort)
  if (!results.length) {
    // Find the main price on the page and the selected/only size
    const mainPriceText = $p('[class*="product-price"], [itemprop="price"]').first().text()
    const mainPrice     = parseFloat(mainPriceText.replace(/[^0-9.]/g, ''))
    const sizeText      = $p('[class*="product-size"], [class*="volume"]').first().text()
    const mainSize      = extractMl(sizeText)
    if (isFinite(mainPrice) && mainPrice > 0 && mainSize) {
      results.push({ size_ml: mainSize, price: mainPrice, affiliate_url: affiliateUrl })
    }
  }

  return results
}

// ── DB helpers ────────────────────────────────────────────────────────────────

/** True if this fragrance already has scraped prices for the retailer checked within 24 hours. */
async function isRecent(fragranceId: string, retailerId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('fragrance_prices')
    .select('id', { count: 'exact', head: true })
    .eq('fragrance_id', fragranceId)
    .eq('retailer_id', retailerId)
    .gt('last_checked', cutoff)
  return (count ?? 0) > 0
}

/** Delete old scraped rows then insert fresh ones. */
async function upsertPrices(
  fragranceId: string,
  retailerId:  string,
  prices:      ParsedPrice[],
): Promise<number> {
  // Remove stale rows for this fragrance+retailer first
  const { error: delErr } = await supabase
    .from('fragrance_prices')
    .delete()
    .eq('fragrance_id', fragranceId)
    .eq('retailer_id', retailerId)

  if (delErr) {
    console.warn(`    DB delete error: ${delErr.message}`)
    return 0
  }

  const rows = prices.map(p => ({
    fragrance_id:  fragranceId,
    retailer_id:   retailerId,
    size_ml:       p.size_ml,
    price:         p.price,
    currency:      'GBP',
    affiliate_url: p.affiliate_url,
    last_checked:  new Date().toISOString(),
  }))

  const { error: insErr } = await supabase.from('fragrance_prices').insert(rows)
  if (insErr) {
    console.warn(`    DB insert error: ${insErr.message}`)
    return 0
  }
  return rows.length
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Perfy price scraper')
  if (DRY_RUN)    console.log('  Mode: DRY RUN (no DB writes)')
  if (TARGET_SLUG) console.log(`  Slug filter: ${TARGET_SLUG}`)
  if (LIMIT)       console.log(`  Limit: ${LIMIT}`)
  console.log('')

  // 1 — Seed / upsert retailers
  console.log('Upserting retailers...')
  const { error: rErr } = await supabase
    .from('retailers')
    .upsert(
      RETAILERS.map(r => ({ slug: r.slug, name: r.name })),
      { onConflict: 'slug' }
    )
  if (rErr) { console.error(`retailers upsert failed: ${rErr.message}`); process.exit(1) }

  const { data: retailerRows, error: rRowErr } = await supabase
    .from('retailers')
    .select('id, slug')
  if (rRowErr) { console.error(`retailers fetch failed: ${rRowErr.message}`); process.exit(1) }

  const retailerIdBySlug: Record<string, string> = {}
  for (const r of retailerRows ?? []) retailerIdBySlug[r.slug] = r.id
  console.log(`  ✓ ${RETAILERS.length} retailers ready\n`)

  // 2 — Fetch fragrances
  let q = supabase
    .from('fragrances')
    .select('id, slug, name, brands(name)')
  if (TARGET_SLUG) q = (q as any).eq('slug', TARGET_SLUG)
  if (LIMIT)       q = (q as any).limit(LIMIT)

  const { data: fragRows, error: fErr } = await q
  if (fErr) { console.error(`fragrances fetch failed: ${fErr.message}`); process.exit(1) }

  type FragRow = { id: string; slug: string; name: string; brands: { name: string } | null }
  const fragrances = (fragRows ?? []) as unknown as FragRow[]
  console.log(`Processing ${fragrances.length} fragrance(s)...\n`)

  // 3 — Scrape
  // Only AllBeauty and Lookfantastic are scraped. The Fragrance Shop is seeded
  // as a retailer so existing synthetic prices (from seed-prices.ts) remain.
  const SCRAPERS: Partial<Record<RetailerSlug, (brand: string, name: string) => Promise<ParsedPrice[]>>> = {
    allbeauty:     scrapeAllBeauty,
    lookfantastic: scrapeLookfantastic,
  }

  let totalWritten = 0
  let totalSkipped = 0
  let fragIdx      = 0

  for (const frag of fragrances) {
    fragIdx++
    const brand = frag.brands?.name ?? ''
    console.log(`[${fragIdx}/${fragrances.length}] ${brand} — ${frag.name} (${frag.slug})`)

    let fragWrote = 0

    for (const retailer of RETAILERS) {
      const scrape     = SCRAPERS[retailer.slug]
      const retailerId = retailerIdBySlug[retailer.slug]
      if (!retailerId) { console.warn(`  ${retailer.name}: no DB id, skipping`); continue }

      // Check freshness
      if (await isRecent(frag.id, retailerId)) {
        console.log(`  ${retailer.name}: already fresh (<24 h), skipping`)
        totalSkipped++
        continue
      }

      if (!scrape) {
        // Retailer is seeded but not scraped (The Fragrance Shop)
        continue
      }

      // Scrape
      let prices: ParsedPrice[] = []
      try {
        prices = await scrape(brand, frag.name)
      } catch (e: any) {
        console.warn(`  ${retailer.name}: scrape threw: ${e.message}`)
      }

      if (!prices.length) {
        console.log(`  ${retailer.name}: no prices found`)
        continue
      }

      console.log(`  ${retailer.name}: ${prices.length} price(s) found`)

      if (DRY_RUN) {
        for (const p of prices) {
          console.log(`    [dry-run] ${p.size_ml}ml → £${p.price}`)
        }
      } else {
        const wrote = await upsertPrices(frag.id, retailerId, prices)
        console.log(`    ✓ ${wrote} row(s) written`)
        fragWrote   += wrote
        totalWritten += wrote
      }

      // Polite gap between retailer requests for the same fragrance
      await delay(1_000)
    }

    if (fragWrote === 0 && !DRY_RUN) {
      console.log('  (no new prices written)')
    }

    // Polite gap between fragrances
    if (fragIdx < fragrances.length) await delay(2_000)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Done.`)
  console.log(`  Prices written : ${totalWritten}`)
  console.log(`  Checks skipped : ${totalSkipped} (already fresh)`)
  if (DRY_RUN) console.log('  (dry-run — no DB changes made)')
}

main().catch(e => { console.error(e.message ?? e); process.exit(1) })
