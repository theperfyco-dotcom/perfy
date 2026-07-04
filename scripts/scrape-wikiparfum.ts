// scripts/scrape-wikiparfum.ts
// Fetches fragrances from Wikiparfum (by popularity), enriches existing DB entries,
// and inserts new fragrances beyond our initial 101.
//
// Run:           npx tsx scripts/scrape-wikiparfum.ts
// Dry run:       npx tsx scripts/scrape-wikiparfum.ts --dry-run
// Limit:         npx tsx scripts/scrape-wikiparfum.ts --limit=200
// Enrich only:   npx tsx scripts/scrape-wikiparfum.ts --enrich-only
// Single slug:   npx tsx scripts/scrape-wikiparfum.ts --slug=aventus
//
// Prerequisites: run supabase/migration-wikiparfum.sql in Supabase first.

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { load as loadHtml } from 'cheerio'

config({ path: '.env.local' })

// ── CLI flags ──────────────────────────────────────────────────────────────────

const DRY_RUN     = process.argv.includes('--dry-run')
const ENRICH_ONLY = process.argv.includes('--enrich-only')
const LIMIT = (() => {
  const f = process.argv.find(a => a.startsWith('--limit='))
  return f ? parseInt(f.split('=')[1], 10) : 500
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

// ── HTTP helpers ───────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function fetchHtml(url: string, timeoutMs = 20000): Promise<string | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return res.text()
  } catch {
    clearTimeout(timer)
    return null
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n').replace(/[ç]/g, 'c').replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Wikiparfum pagination API ──────────────────────────────────────────────────

interface WpFragranceRef {
  slug: string
  name: string
  gender: string // 'M' | 'F' | 'U'
  id: string
}

async function fetchPopularSlugs(totalLimit: number): Promise<WpFragranceRef[]> {
  const results: WpFragranceRef[] = []
  let page = 1
  const pageSize = 100

  while (results.length < totalLimit) {
    const body = JSON.stringify({
      modelName: 'PerfumeGridGallery',
      limit: pageSize,
      paginationInfo: { type: 'latestPerfumeReleases' },
      sort: 'popularity',
      page,
      filters: { discontinued: 'yes' },
      lang: 'en',
      country: 'GB',
    })

    const res = await fetch('https://web-api-v3.wikiparfum.com/api/dynamic/pagination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body,
    })

    if (!res.ok) break
    const data = await res.json()
    const frags: WpFragranceRef[] = (data?.results?.fragrances ?? [])
      .map((f: Record<string, string>) => ({ slug: f.slug, name: f.name, gender: f.gender, id: f.id }))

    if (frags.length === 0) break
    results.push(...frags)
    if (frags.length < pageSize) break
    page++
    await sleep(1000)
  }

  return results.slice(0, totalLimit)
}

// ── Fragrance detail page parser ───────────────────────────────────────────────

interface WpDetail {
  brandName: string
  brandSlug: string
  name: string
  fwClassification: string | null
  perfumerName: string | null
  perfumerSlug: string | null
  gender: string | null  // 'Male' | 'Female' | 'Unisex'
  year: number | null
  origin: string | null
  concepts: string[]
  notes: string[]  // flat list, no tier
  description: string | null
}

async function fetchFragranceDetail(wpSlug: string): Promise<WpDetail | null> {
  const html = await fetchHtml(`https://www.wikiparfum.com/en/fragrances/${wpSlug}`)
  if (!html) return null

  const $ = loadHtml(html)

  // Brand
  const brandEl = $('a[href*="/en/brands/"]').first()
  const brandName = brandEl.text().trim()
  const brandHref = brandEl.attr('href') ?? ''
  const brandSlug = brandHref.split('/en/brands/')[1]?.replace(/\/$/, '') ?? ''

  if (!brandName || !brandSlug) return null

  // Fragrance name
  const name = $('h1').first().text().trim()
  if (!name) return null

  // Metadata from dt/dd pairs
  const meta: Record<string, string> = {}
  $('dt').each((_i, el) => {
    const key = $(el).text().trim().toUpperCase()
    const val = $(el).next('dd').text().trim()
    if (key && val) meta[key] = val
  })

  const fwClassification = meta['CLASIF. FRAGRANCES OF THE WORLD'] ?? null
  const perfumerRaw = meta['PERFUMER'] ?? null
  const genderRaw = meta['GENDER'] ?? null
  const yearRaw = meta['YEAR'] ?? null
  const origin = meta['ORIGIN'] ?? null
  const conceptsRaw = meta['CONCEPTS'] ?? ''
  const concepts = conceptsRaw ? conceptsRaw.split(',').map(c => c.trim()).filter(Boolean) : []

  const year = yearRaw ? parseInt(yearRaw, 10) : null

  // Perfumer slug from link
  const perfEl = $('a[href*="/en/perfumers/"]').first()
  const perfHref = perfEl.attr('href') ?? ''
  const perfumerSlug = perfHref.split('/en/perfumers/')[1]?.replace(/\/$/, '') ?? null
  const perfumerName = perfumerRaw

  // Notes: unique non-empty ingredient links (strip '| ' separator prefix)
  const noteSet = new Set<string>()
  $('a[href*="/en/ingredients/"]').each((_i, el) => {
    const text = $(el).text().trim().replace(/^\|\s*/, '').trim()
    if (text && text.length > 0 && text.length < 80) noteSet.add(text)
  })
  const notes = Array.from(noteSet)

  // Description from meta tag
  const description = $('meta[name="description"]').attr('content')?.trim() ?? null

  return {
    brandName,
    brandSlug,
    name,
    fwClassification,
    perfumerName,
    perfumerSlug,
    gender: genderRaw,
    year,
    origin,
    concepts,
    notes,
    description,
  }
}

// ── Gender normaliser ──────────────────────────────────────────────────────────

function normaliseGender(g: string | null): 'masculine' | 'feminine' | 'unisex' {
  if (!g) return 'unisex'
  const lower = g.toLowerCase()
  if (lower.includes('male') && !lower.includes('female')) return 'masculine'
  if (lower.includes('female') || lower.includes('femin') || lower.includes('women')) return 'feminine'
  return 'unisex'
}

// ── Fuzzy name matching ────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN)     console.log('DRY RUN — no DB writes\n')
  if (ENRICH_ONLY) console.log('ENRICH ONLY — skipping new fragrances\n')
  if (SLUG_FILTER) console.log(`Single slug mode: ${SLUG_FILTER}\n`)

  // 1. Fetch slug list from Wikiparfum pagination API
  let wpSlugs: WpFragranceRef[]
  if (SLUG_FILTER) {
    wpSlugs = [{ slug: SLUG_FILTER, name: '', gender: '', id: '' }]
  } else {
    process.stdout.write(`Fetching top ${LIMIT} fragrances from Wikiparfum... `)
    wpSlugs = await fetchPopularSlugs(LIMIT)
    console.log(`${wpSlugs.length} slugs retrieved`)
  }

  // 2. Load existing DB fragrances for matching
  const { data: existingFrags, error: efErr } = await supabase
    .from('fragrances')
    .select('id, slug, name, brand_id, wikiparfum_slug, brands(name, slug)')
    .order('name')
  if (efErr) throw new Error(efErr.message)

  // Build lookup: normalized "brandname + fragname" → fragrance row
  const existingByKey = new Map<string, typeof existingFrags[0]>()
  const existingByWpSlug = new Map<string, typeof existingFrags[0]>()
  for (const f of (existingFrags ?? [])) {
    const brand = Array.isArray(f.brands) ? f.brands[0] : (f.brands as { name: string; slug: string } | null)
    const key = normalize((brand?.name ?? '') + (f.name ?? ''))
    existingByKey.set(key, f)
    if (f.wikiparfum_slug) existingByWpSlug.set(f.wikiparfum_slug, f)
  }

  // 3. Load brand slug → id map
  const { data: brandRows, error: brErr } = await supabase.from('brands').select('id, slug, name')
  if (brErr) throw new Error(brErr.message)
  const brandIdBySlug = new Map<string, string>()
  const brandIdByNormalizedName = new Map<string, string>()
  for (const b of (brandRows ?? [])) {
    brandIdBySlug.set(b.slug, b.id)
    brandIdByNormalizedName.set(normalize(b.name), b.id)
  }

  // 4. Load existing notes
  const { data: noteRows, error: nrErr } = await supabase.from('notes').select('id, name')
  if (nrErr) throw new Error(nrErr.message)
  const noteIdByName = new Map<string, string>()
  for (const n of (noteRows ?? [])) noteIdByName.set(n.name.toLowerCase(), n.id)

  // 5. Process each Wikiparfum slug
  let enriched = 0, inserted = 0, skipped = 0, failed = 0

  for (let i = 0; i < wpSlugs.length; i++) {
    const ref = wpSlugs[i]
    process.stdout.write(`[${i + 1}/${wpSlugs.length}] ${ref.slug} ... `)

    // Already processed?
    if (existingByWpSlug.has(ref.slug)) {
      console.log('already linked, skipping')
      skipped++
      continue
    }

    // Fetch detail page
    const detail = await fetchFragranceDetail(ref.slug)
    if (!detail) {
      console.log('fetch failed')
      failed++
      await sleep(2000)
      continue
    }

    // Try to match existing fragrance
    const matchKey = normalize(detail.brandName + detail.name)
    const existing = existingByKey.get(matchKey)

    if (existing) {
      // Enrich existing fragrance
      if (!DRY_RUN) {
        const { error: upErr } = await supabase
          .from('fragrances')
          .update({
            wikiparfum_slug:  ref.slug,
            fw_classification: detail.fwClassification ?? undefined,
            perfumer:         detail.perfumerName ?? undefined,
            origin:           detail.origin ?? undefined,
            concepts:         detail.concepts.length > 0 ? detail.concepts : undefined,
            // Only fill description if empty
            ...(detail.description ? { description: detail.description } : {}),
          })
          .eq('id', existing.id)
        if (upErr) { console.log(`enrichment failed: ${upErr.message}`); failed++; await sleep(2000); continue }

        // Insert any new notes (flat, no tier)
        if (detail.notes.length > 0) {
          await upsertNotes(detail.notes, existing.id, noteIdByName)
        }
      }
      console.log(`enriched (${detail.brandName} — ${detail.name})`)
      enriched++
      await sleep(2000)
      continue
    }

    // New fragrance
    if (ENRICH_ONLY) {
      console.log(`new — skipped (enrich-only mode)`)
      skipped++
      await sleep(1500)
      continue
    }

    if (DRY_RUN) {
      console.log(`new → ${detail.brandName} — ${detail.name} [${detail.notes.length} notes]`)
      inserted++
      await sleep(500)
      continue
    }

    // Ensure brand exists
    let brandId = brandIdBySlug.get(detail.brandSlug) ?? brandIdByNormalizedName.get(normalize(detail.brandName))
    if (!brandId) {
      const { data: newBrand, error: bErr } = await supabase
        .from('brands')
        .upsert({ slug: detail.brandSlug, name: detail.brandName }, { onConflict: 'slug' })
        .select('id')
        .single()
      if (bErr || !newBrand) { console.log(`brand create failed: ${bErr?.message}`); failed++; await sleep(2000); continue }
      brandId = newBrand.id as string
      brandIdBySlug.set(detail.brandSlug, brandId as string)
      brandIdByNormalizedName.set(normalize(detail.brandName), brandId as string)
    }

    // Generate unique fragrance slug
    const fragSlug = `${detail.brandSlug}-${slugify(detail.name)}`

    // Insert fragrance
    const { data: newFrag, error: fErr } = await supabase
      .from('fragrances')
      .upsert({
        slug:             fragSlug,
        name:             detail.name,
        brand_id:         brandId,
        description:      detail.description,
        year:             detail.year,
        gender:           normaliseGender(detail.gender),
        fw_classification: detail.fwClassification,
        perfumer:         detail.perfumerName,
        origin:           detail.origin,
        concepts:         detail.concepts.length > 0 ? detail.concepts : null,
        wikiparfum_slug:  ref.slug,
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (fErr || !newFrag) { console.log(`insert failed: ${fErr?.message}`); failed++; await sleep(2000); continue }

    // Insert notes
    if (detail.notes.length > 0) {
      await upsertNotes(detail.notes, newFrag.id, noteIdByName)
    }

    // Update lookup so duplicates in the batch are caught
    existingByKey.set(matchKey, { ...newFrag, slug: fragSlug, name: detail.name, brand_id: brandId, wikiparfum_slug: ref.slug, brands: [{ name: detail.brandName, slug: detail.brandSlug }] } as unknown as typeof existingFrags[0])

    console.log(`inserted → ${detail.brandName} — ${detail.name} [${detail.notes.length} notes]`)
    inserted++
    await sleep(2500)
  }

  console.log(`
─────────────────────────────────────────────────
Done:
  ${enriched} enriched
  ${inserted} inserted
  ${skipped} skipped
  ${failed} failed
`)
}

// ── Note upsert helper ─────────────────────────────────────────────────────────

async function upsertNotes(
  noteNames: string[],
  fragranceId: string,
  noteIdByName: Map<string, string>
) {
  // Ensure all notes exist in the notes table
  const toCreate = noteNames.filter(n => !noteIdByName.has(n.toLowerCase()))
  if (toCreate.length > 0) {
    const { data: created, error: cErr } = await supabase
      .from('notes')
      .upsert(toCreate.map(name => ({ name, family: 'fresh' })), { onConflict: 'name' })
      .select('id, name')
    if (!cErr && created) {
      for (const n of created) noteIdByName.set(n.name.toLowerCase(), n.id)
    }
  }

  // Re-fetch any still missing (upsert may not return all on conflict)
  const stillMissing = noteNames.filter(n => !noteIdByName.has(n.toLowerCase()))
  if (stillMissing.length > 0) {
    const { data: fetched } = await supabase
      .from('notes')
      .select('id, name')
      .in('name', stillMissing)
    for (const n of (fetched ?? [])) noteIdByName.set(n.name.toLowerCase(), n.id)
  }

  // Insert fragrance_notes rows (position null — no tier data from Wikiparfum)
  const rows = noteNames
    .map(n => ({ fragrance_id: fragranceId, note_id: noteIdByName.get(n.toLowerCase()) }))
    .filter(r => r.note_id) as { fragrance_id: string; note_id: string }[]

  if (rows.length > 0) {
    await supabase
      .from('fragrance_notes')
      .upsert(rows, { onConflict: 'fragrance_id,note_id', ignoreDuplicates: true })
  }
}

main().catch(err => { console.error('\nFatal:', err.message); process.exit(1) })
