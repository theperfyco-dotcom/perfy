// scripts/update-images.ts
// Pages through the Wikiparfum API and downloads/uploads product images for all
// fragrances in our DB that have a wikiparfum_slug but no image_url.
//
// Run:       npx tsx scripts/update-images.ts
// Dry run:   npx tsx scripts/update-images.ts --dry-run
// Limit:     npx tsx scripts/update-images.ts --api-limit=500  (how many from API)
// Force:     npx tsx scripts/update-images.ts --force  (re-download even if image set)

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY_RUN   = process.argv.includes('--dry-run')
const FORCE     = process.argv.includes('--force')
const API_LIMIT = (() => {
  const f = process.argv.find(a => a.startsWith('--api-limit='))
  return f ? parseInt(f.split('=')[1], 10) : 99999
})()

const BUCKET = 'fragrance-images'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const PAGE_SIZE = 100

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

interface WpImage {
  name: string
  type: string
  sizes: number[]
  extension: string
  urls: { low: string; mid: string; high: string }
}

interface WpFrag {
  slug: string
  image?: WpImage
}

// ── Page through Wikiparfum pagination API ─────────────────────────────────────

async function* allWikiperfumes(): AsyncGenerator<WpFrag> {
  let page = 1
  let total = 0

  while (total < API_LIMIT) {
    const body = JSON.stringify({
      modelName: 'PerfumeGridGallery',
      limit: PAGE_SIZE,
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
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) break
    const data = await res.json()
    const frags: WpFrag[] = data?.results?.fragrances ?? []
    if (frags.length === 0) break

    for (const f of frags) {
      yield f
      total++
      if (total >= API_LIMIT) return
    }

    if (frags.length < PAGE_SIZE) break
    page++
    await sleep(600)
  }
}

// ── Download + upload ──────────────────────────────────────────────────────────

// Use the pre-generated 'high' (500px) URL from the API — larger sizes may not exist
function imageUrl(img: WpImage): string {
  return img.urls?.high ?? img.urls?.mid ?? img.urls?.low
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.length > 2048 ? buf : null
  } catch {
    return null
  }
}

async function uploadAndUpdate(
  fragranceId: string, slug: string, img: WpImage
): Promise<boolean> {
  const srcUrl = imageUrl(img)
  if (!srcUrl) { process.stdout.write(' [no url]'); return false }
  const buf = await downloadImage(srcUrl)
  if (!buf) return false

  // Always store as .jpg regardless of declared mime type (CDN always serves JPEG)
  const path = `${slug}.jpg`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: 'image/jpeg', upsert: true })
  if (upErr) { process.stdout.write(` [storage: ${upErr.message}]`); return false }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: dbErr } = await supabase
    .from('fragrances').update({ image_url: publicUrl }).eq('id', fragranceId)
  if (dbErr) { process.stdout.write(` [db: ${dbErr.message}]`); return false }

  return true
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n── Perfy image updater (Wikiparfum API)${DRY_RUN ? ' [DRY RUN]' : ''} ──\n`)

  // Load all our DB fragrances that need images, indexed by wikiparfum_slug
  const dbQuery = supabase
    .from('fragrances')
    .select('id, slug, wikiparfum_slug, image_url')
    .not('wikiparfum_slug', 'is', null)
  if (!FORCE) {
    // Only get ones without images
    (dbQuery as unknown as ReturnType<typeof supabase.from>)
  }

  // Fetch all matching rows (paginate past Supabase's 1000-row default)
  const allDbFrags: Array<{ id: string; slug: string; wikiparfum_slug: string | null; image_url: string | null }> = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const q = FORCE
      ? supabase.from('fragrances').select('id, slug, wikiparfum_slug, image_url').not('wikiparfum_slug', 'is', null).range(from, from + PAGE - 1)
      : supabase.from('fragrances').select('id, slug, wikiparfum_slug, image_url').not('wikiparfum_slug', 'is', null).is('image_url', null).range(from, from + PAGE - 1)
    const { data, error: qErr } = await q
    if (qErr) { console.error('DB error:', qErr.message); process.exit(1) }
    if (!data?.length) break
    allDbFrags.push(...data as typeof allDbFrags)
    if (data.length < PAGE) break
    from += PAGE
  }
  const dbFrags = allDbFrags
  const error = null

  if (error) { console.error('DB error:', error.message); process.exit(1) }

  const needsImage = new Map<string, { id: string; slug: string }>()
  for (const f of (dbFrags ?? [])) {
    if (f.wikiparfum_slug) needsImage.set(f.wikiparfum_slug, { id: f.id, slug: f.slug })
  }

  console.log(`DB fragrances needing images: ${needsImage.size}`)
  console.log(`Paging through Wikiparfum API (up to ${API_LIMIT} fragrances)…\n`)

  let apiCount = 0, uploaded = 0, noImage = 0, failed = 0

  for await (const wpFrag of allWikiperfumes()) {
    apiCount++

    const dbEntry = needsImage.get(wpFrag.slug)
    if (!dbEntry) continue  // not in our DB or already has image

    if (!wpFrag.image) {
      process.stdout.write(`${dbEntry.slug}: no image in API\n`)
      noImage++
      continue
    }

    const src = imageUrl(wpFrag.image)
    if (!src) { console.log(`${dbEntry.slug}: no url in image object`); noImage++; continue }
    if (DRY_RUN) {
      console.log(`${dbEntry.slug}: ${src.slice(-60)}`)
      uploaded++
      continue
    }

    process.stdout.write(`${dbEntry.slug} … `)
    const ok = await uploadAndUpdate(dbEntry.id, dbEntry.slug, wpFrag.image)
    if (ok) { console.log('ok'); uploaded++ }
    else { console.log('failed'); failed++ }

    // Remove from map so we know what we've processed
    needsImage.delete(wpFrag.slug)

    // Stop if we've processed all that need images
    if (needsImage.size === 0) break

    await sleep(200)  // light delay — API is generous
  }

  console.log(`\n── API pages: ${apiCount} fragrances checked`)
  console.log(`── Images: ${uploaded} uploaded, ${noImage} had no image, ${failed} failed`)
  if (needsImage.size > 0) {
    console.log(`── ${needsImage.size} fragrances in DB not found in API (beyond API_LIMIT or no WP entry)`)
  }
  console.log()
}

main().catch(err => { console.error('\nFatal:', err.message); process.exit(1) })
