// scripts/scrape-images.ts
// Downloads product images for all fragrances and uploads them to Supabase Storage.
//
// Strategy (in priority order):
//   1. Wikiparfum image (for fragrances with wikiparfum_slug) — their CDN, high quality
//   2. AllBeauty (Shopify og:image, 2000px)
//   3. Lookfantastic (thcdn.com)
//
// Run:        npx tsx scripts/scrape-images.ts
// Dry run:    npx tsx scripts/scrape-images.ts --dry-run
// Limit:      npx tsx scripts/scrape-images.ts --limit=50
// One slug:   npx tsx scripts/scrape-images.ts --slug=creed-aventus
// Force redo: npx tsx scripts/scrape-images.ts --force  (even if image_url already set)

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { load as loadHtml } from 'cheerio'

config({ path: '.env.local' })

// ── CLI flags ──────────────────────────────────────────────────────────────────

const DRY_RUN     = process.argv.includes('--dry-run')
const FORCE       = process.argv.includes('--force')
const LIMIT = (() => {
  const f = process.argv.find(a => a.startsWith('--limit='))
  return f ? parseInt(f.split('=')[1], 10) : 9999
})()
const SLUG_FILTER = (() => {
  const f = process.argv.find(a => a.startsWith('--slug='))
  return f ? f.split('=')[1] : null
})()

// ── Supabase ───────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function fetchText(url: string, timeoutMs = 20000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

async function downloadBuffer(url: string): Promise<{ buf: Buffer; mime: string; ext: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Referer': 'https://www.wikiparfum.com/' },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? 'image/jpeg'
    const mime = ct.includes('png') ? 'image/png' : ct.includes('webp') ? 'image/webp' : 'image/jpeg'
    const ext  = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    const buf  = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2048) return null
    return { buf, mime, ext }
  } catch {
    return null
  }
}

// ── Source 1: Wikiparfum ───────────────────────────────────────────────────────

async function fromWikiparfum(wpSlug: string): Promise<string | null> {
  const html = await fetchText(`https://www.wikiparfum.com/en/fragrances/${wpSlug}`)
  if (!html) return null
  // First <link rel="preload" href="https://api-assets.wikiparfum.com/_resized/...-w1750-q85.jpg" as="image">
  const m = html.match(/href="(https:\/\/api-assets\.wikiparfum\.com\/_resized\/[^"]+w1750[^"]+\.jpg)"/)
  return m ? m[1] : null
}

// ── Source 2: AllBeauty (Shopify) ─────────────────────────────────────────────

function getOgImage(html: string): string | null {
  const $ = loadHtml(html)
  for (const attr of ['meta[property="og:image:secure_url"]', 'meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const v = $(attr).attr('content')
    if (v && v.startsWith('http') && !v.includes('logo') && !v.includes('icon') && !v.includes('placeholder')) return v
  }
  return null
}

async function fromAllBeauty(brandName: string, fragName: string): Promise<string | null> {
  const q = `${brandName} ${fragName}`
  const searchHtml = await fetchText(`https://www.allbeauty.com/search?q=${encodeURIComponent(q)}`)
  if (!searchHtml) return null
  const $ = loadHtml(searchHtml)
  let productPath: string | null = null
  $('a[href*="/products/"]').each((_i, el) => {
    if (productPath) return
    const href = $(el).attr('href') ?? ''
    if (!href.startsWith('/products/')) return
    const bare = href.split('?')[0]
    if (bare === '/products/' || bare.endsWith('/cart') || bare.endsWith('/checkout')) return
    productPath = bare
  })
  if (!productPath) return null
  const productHtml = await fetchText(`https://www.allbeauty.com${productPath}`)
  return productHtml ? getOgImage(productHtml) : null
}

// ── Source 3: Lookfantastic ────────────────────────────────────────────────────

async function fromLookfantastic(brandName: string, fragName: string): Promise<string | null> {
  const q = `${brandName} ${fragName}`
  const html = await fetchText(`https://www.lookfantastic.com/search?q=${encodeURIComponent(q)}`)
  if (!html) return null
  const $ = loadHtml(html)
  let imageUrl: string | null = null
  $('product-card-wrapper[data-quicklook-url]').each((_i, el) => {
    if (imageUrl) return
    const imgSrc = $(el).find('img').first().attr('src') ?? ''
    if (!imgSrc || !imgSrc.includes('thcdn.com')) return
    try {
      const parsed = new URL(imgSrc.startsWith('http') ? imgSrc : `https://www.lookfantastic.com${imgSrc}`)
      const direct = parsed.searchParams.get('url')
      imageUrl = direct && direct.startsWith('https://static.thcdn.com') ? direct : imgSrc
    } catch {
      imageUrl = imgSrc
    }
  })
  return imageUrl
}

// ── Upload ─────────────────────────────────────────────────────────────────────

async function uploadAndSave(fragranceId: string, slug: string, imageSourceUrl: string): Promise<boolean> {
  const dl = await downloadBuffer(imageSourceUrl)
  if (!dl) { process.stdout.write(' [download failed]'); return false }

  const path = `${slug}.${dl.ext}`
  const { error: upErr } = await supabase.storage
    .from('fragrance-images')
    .upload(path, dl.buf, { contentType: dl.mime, upsert: true })
  if (upErr) { process.stdout.write(` [upload: ${upErr.message}]`); return false }

  const { data: { publicUrl } } = supabase.storage.from('fragrance-images').getPublicUrl(path)

  const { error: dbErr } = await supabase
    .from('fragrances').update({ image_url: publicUrl }).eq('id', fragranceId)
  if (dbErr) { process.stdout.write(` [db: ${dbErr.message}]`); return false }

  process.stdout.write(` (${Math.round(dl.buf.length / 1024)}KB)`)
  return true
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n── Perfy image scraper${DRY_RUN ? ' [DRY RUN]' : ''} ──────────────────────────\n`)

  // Load fragrances: join brands to get brand name for AllBeauty/LF fallback
  let query = supabase
    .from('fragrances')
    .select('id, slug, name, wikiparfum_slug, image_url, brands(name)')
    .order('created_at', { ascending: true })
    .limit(LIMIT)

  if (!FORCE) query = query.is('image_url', null)
  if (SLUG_FILTER) query = query.eq('slug', SLUG_FILTER)

  const { data: frags, error } = await query
  if (error) { console.error('DB error:', error.message); process.exit(1) }
  if (!frags?.length) { console.log('No fragrances to process.'); return }

  console.log(`Found ${frags.length} fragrances to image-scrape\n`)

  let done = 0, noimgFound = 0, uploadFailed = 0

  for (const frag of frags) {
    const brandName = (frag.brands as { name: string } | null)?.name ?? ''
    process.stdout.write(`${frag.slug} … `)

    let sourceUrl: string | null = null
    let source = ''

    // 1. Wikiparfum (fastest — we already have the slug)
    if (frag.wikiparfum_slug) {
      sourceUrl = await fromWikiparfum(frag.wikiparfum_slug)
      if (sourceUrl) source = 'wp'
      await sleep(1200)
    }

    // 2. AllBeauty fallback
    if (!sourceUrl && brandName) {
      sourceUrl = await fromAllBeauty(brandName, frag.name)
      if (sourceUrl) source = 'ab'
      await sleep(800)
    }

    // 3. Lookfantastic fallback
    if (!sourceUrl && brandName) {
      sourceUrl = await fromLookfantastic(brandName, frag.name)
      if (sourceUrl) source = 'lf'
    }

    if (!sourceUrl) {
      console.log('no image found')
      noimgFound++
      await sleep(1000)
      continue
    }

    if (DRY_RUN) {
      console.log(`[${source}] ${sourceUrl.slice(-60)}`)
      done++
      continue
    }

    const ok = await uploadAndSave(frag.id, frag.slug, sourceUrl)
    console.log(ok ? ` ok [${source}]` : ' failed')
    if (ok) done++; else uploadFailed++

    await sleep(1500)
  }

  console.log(`\n── Done: ${done} uploaded · ${noimgFound} no image · ${uploadFailed} upload failed ──\n`)
}

main().catch(err => { console.error('\nFatal:', err.message); process.exit(1) })
