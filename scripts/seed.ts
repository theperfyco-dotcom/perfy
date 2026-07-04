// scripts/seed.ts
// Run with: npx tsx scripts/seed.ts
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { BRANDS, FRAGRANCES, NOTE_FAMILIES } from './seed-data'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('Starting seed...\n')

  // ── 1. Upsert brands ──────────────────────────────────────────────────────
  console.log(`Upserting ${BRANDS.length} brands...`)
  const { error: brandErr } = await supabase.from('brands').upsert(
    BRANDS.map(b => ({ slug: b.slug, name: b.name, country: b.country })),
    { onConflict: 'slug' }
  )
  if (brandErr) throw new Error(`brands: ${brandErr.message}`)
  console.log('  ✓ brands done')

  // Fetch brand id map
  const { data: brandRows, error: brandFetchErr } = await supabase
    .from('brands')
    .select('id, slug')
  if (brandFetchErr) throw new Error(`fetch brands: ${brandFetchErr.message}`)
  const brandIdBySlug: Record<string, string> = {}
  for (const b of brandRows!) brandIdBySlug[b.slug] = b.id

  // ── 2. Collect all unique notes ───────────────────────────────────────────
  const allNoteNames = new Set<string>()
  for (const f of FRAGRANCES) {
    for (const n of [...f.top_notes, ...f.heart_notes, ...f.base_notes]) {
      allNoteNames.add(n)
    }
  }

  const noteRows = Array.from(allNoteNames).map(name => ({
    name,
    family: NOTE_FAMILIES[name] ?? 'fresh',
  }))

  console.log(`Upserting ${noteRows.length} unique notes...`)
  const { error: noteErr } = await supabase.from('notes').upsert(noteRows, { onConflict: 'name' })
  if (noteErr) throw new Error(`notes: ${noteErr.message}`)
  console.log('  ✓ notes done')

  // Fetch note id map
  const { data: noteDbRows, error: noteFetchErr } = await supabase
    .from('notes')
    .select('id, name')
  if (noteFetchErr) throw new Error(`fetch notes: ${noteFetchErr.message}`)
  const noteIdByName: Record<string, string> = {}
  for (const n of noteDbRows!) noteIdByName[n.name] = n.id

  // ── 3. Upsert fragrances ──────────────────────────────────────────────────
  console.log(`Upserting ${FRAGRANCES.length} fragrances...`)
  const { error: fragErr } = await supabase.from('fragrances').upsert(
    FRAGRANCES.map(f => ({
      slug:          f.slug,
      name:          f.name,
      brand_id:      brandIdBySlug[f.brand_slug],
      description:   f.description,
      year:          f.year,
      concentration: f.concentration,
      gender:        f.gender,
    })),
    { onConflict: 'slug' }
  )
  if (fragErr) throw new Error(`fragrances: ${fragErr.message}`)
  console.log('  ✓ fragrances done')

  // Fetch fragrance id map
  const { data: fragRows, error: fragFetchErr } = await supabase
    .from('fragrances')
    .select('id, slug')
  if (fragFetchErr) throw new Error(`fetch fragrances: ${fragFetchErr.message}`)
  const fragIdBySlug: Record<string, string> = {}
  for (const f of fragRows!) fragIdBySlug[f.slug] = f.id

  // ── 4. Upsert accords ─────────────────────────────────────────────────────
  console.log('Upserting accords...')
  const accordRows = FRAGRANCES.flatMap(f =>
    f.accords.map(a => ({
      fragrance_id: fragIdBySlug[f.slug],
      accord_name:  a.name,
      percentage:   a.percentage,
    }))
  )
  const { error: accordErr } = await supabase
    .from('fragrance_accords')
    .upsert(accordRows, { onConflict: 'fragrance_id,accord_name' })
  if (accordErr) throw new Error(`accords: ${accordErr.message}`)
  console.log('  ✓ accords done')

  // ── 5. Upsert fragrance notes ─────────────────────────────────────────────
  console.log('Upserting fragrance notes...')
  const fragNoteRows = FRAGRANCES.flatMap(f => {
    const seen = new Set<string>()
    const rows: { fragrance_id: string; note_id: string; position: 'top' | 'heart' | 'base' }[] = []
    const fragId = fragIdBySlug[f.slug]
    for (const [notes, pos] of [[f.top_notes, 'top'], [f.heart_notes, 'heart'], [f.base_notes, 'base']] as const) {
      for (const n of notes) {
        const noteId = noteIdByName[n]
        if (!noteId || seen.has(n)) continue
        seen.add(n)
        rows.push({ fragrance_id: fragId, note_id: noteId, position: pos })
      }
    }
    return rows
  })

  const { error: fnErr } = await supabase
    .from('fragrance_notes')
    .upsert(fragNoteRows, { onConflict: 'fragrance_id,note_id' })
  if (fnErr) throw new Error(`fragrance_notes: ${fnErr.message}`)
  console.log('  ✓ fragrance notes done')

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
Seed complete:
  ${BRANDS.length} brands
  ${FRAGRANCES.length} fragrances
  ${noteRows.length} unique notes
  ${accordRows.length} accord links
  ${fragNoteRows.length} note links
`)
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
