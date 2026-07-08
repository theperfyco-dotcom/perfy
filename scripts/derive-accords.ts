// scripts/derive-accords.ts
// Derives accord profiles from note composition for fragrances that have
// notes but no accord data. Never touches fragrances with existing accords
// (the seeded profiles are source data; these are estimates).
//
// Run:      npx tsx scripts/derive-accords.ts
// Dry run:  npx tsx scripts/derive-accords.ts --dry-run

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY_RUN = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Matches the palette in src/lib/accord-colors.ts
const ACCORD_COLORS: Record<string, string> = {
  Fresh:    '#9FC4D4',
  Floral:   '#D4A5A5',
  Woody:    '#C4A07A',
  Spicy:    '#CC8B6E',
  Citrus:   '#D4C47A',
  Amber:    '#D4AA6E',
  Musky:    '#B8A8CC',
  Green:    '#8DC4A0',
  Oud:      '#8C78CC',
  Leather:  '#9C7A5A',
  Smoky:    '#6E6480',
  Powdery:  '#C8B8C8',
  Fruity:   '#8DC4A0',
  Aromatic: '#A0C4A0',
}

// Ordered rules — first match wins, so specific phrases come before generic words.
const RULES: Array<[string, string]> = [
  // Specific multi-word notes first
  ['orange blossom', 'Floral'], ['neroli', 'Floral'],
  ['tomato leaf', 'Green'], ['fig leaf', 'Green'], ['green tea', 'Green'],
  ['pink pepper', 'Spicy'], ['birch tar', 'Smoky'],
  ['white musk', 'Musky'],

  // Oud / leather / smoke
  ['oud', 'Oud'], ['agarwood', 'Oud'],
  ['leather', 'Leather'], ['suede', 'Leather'], ['castoreum', 'Leather'],
  ['smoke', 'Smoky'], ['smoky', 'Smoky'], ['tobacco', 'Smoky'], ['incense', 'Smoky'], ['tar', 'Smoky'],

  // Citrus
  ['bergamot', 'Citrus'], ['lemon', 'Citrus'], ['lime', 'Citrus'], ['orange', 'Citrus'],
  ['mandarin', 'Citrus'], ['tangerine', 'Citrus'], ['grapefruit', 'Citrus'], ['citrus', 'Citrus'],
  ['citron', 'Citrus'], ['yuzu', 'Citrus'], ['petitgrain', 'Citrus'], ['pomelo', 'Citrus'],
  ['kumquat', 'Citrus'], ['verbena', 'Citrus'],

  // Aromatic herbs
  ['lavender', 'Aromatic'], ['rosemary', 'Aromatic'], ['sage', 'Aromatic'], ['thyme', 'Aromatic'],
  ['basil', 'Aromatic'], ['mint', 'Aromatic'], ['artemisia', 'Aromatic'], ['eucalyptus', 'Aromatic'],
  ['juniper', 'Aromatic'], ['bay leaf', 'Aromatic'], ['herb', 'Aromatic'], ['tarragon', 'Aromatic'],
  ['caraway', 'Aromatic'], ['fennel', 'Aromatic'],

  // Green
  ['green', 'Green'], ['grass', 'Green'], ['galbanum', 'Green'], ['ivy', 'Green'],
  ['bamboo', 'Green'], ['leaf', 'Green'], ['leaves', 'Green'], ['stem', 'Green'],
  ['matcha', 'Green'], ['tea', 'Green'],

  // Fresh / aquatic
  ['marine', 'Fresh'], ['sea', 'Fresh'], ['aquatic', 'Fresh'], ['ozonic', 'Fresh'],
  ['water', 'Fresh'], ['rain', 'Fresh'], ['cucumber', 'Fresh'], ['calone', 'Fresh'],
  ['ice', 'Fresh'], ['snow', 'Fresh'], ['air', 'Fresh'], ['salty', 'Fresh'], ['salt', 'Fresh'],

  // Fruity
  ['apple', 'Fruity'], ['pear', 'Fruity'], ['peach', 'Fruity'], ['plum', 'Fruity'],
  ['berry', 'Fruity'], ['berries', 'Fruity'], ['cherry', 'Fruity'], ['pineapple', 'Fruity'],
  ['mango', 'Fruity'], ['melon', 'Fruity'], ['coconut', 'Fruity'], ['apricot', 'Fruity'],
  ['lychee', 'Fruity'], ['litchi', 'Fruity'], ['fig', 'Fruity'], ['cassis', 'Fruity'],
  ['blackcurrant', 'Fruity'], ['currant', 'Fruity'], ['passion', 'Fruity'], ['papaya', 'Fruity'],
  ['banana', 'Fruity'], ['quince', 'Fruity'], ['pomegranate', 'Fruity'], ['rhubarb', 'Fruity'],
  ['grape', 'Fruity'], ['date', 'Fruity'], ['mirabelle', 'Fruity'], ['nectarine', 'Fruity'],

  // Spicy
  ['pepper', 'Spicy'], ['cinnamon', 'Spicy'], ['cardamom', 'Spicy'], ['clove', 'Spicy'],
  ['nutmeg', 'Spicy'], ['ginger', 'Spicy'], ['saffron', 'Spicy'], ['spice', 'Spicy'],
  ['spicy', 'Spicy'], ['cumin', 'Spicy'], ['coriander', 'Spicy'], ['anise', 'Spicy'],
  ['pimento', 'Spicy'], ['chili', 'Spicy'], ['curry', 'Spicy'],

  // Powdery
  ['orris', 'Powdery'], ['heliotrope', 'Powdery'], ['powder', 'Powdery'], ['talc', 'Powdery'],
  ['cosmetic', 'Powdery'],

  // Floral
  ['rose', 'Floral'], ['jasmine', 'Floral'], ['iris', 'Floral'], ['violet', 'Floral'],
  ['peony', 'Floral'], ['lily', 'Floral'], ['ylang', 'Floral'], ['tuberose', 'Floral'],
  ['freesia', 'Floral'], ['magnolia', 'Floral'], ['gardenia', 'Floral'], ['geranium', 'Floral'],
  ['flower', 'Floral'], ['floral', 'Floral'], ['blossom', 'Floral'], ['lotus', 'Floral'],
  ['mimosa', 'Floral'], ['narcissus', 'Floral'], ['orchid', 'Floral'], ['hibiscus', 'Floral'],
  ['plumeria', 'Floral'], ['frangipani', 'Floral'], ['osmanthus', 'Floral'], ['honeysuckle', 'Floral'],
  ['lilac', 'Floral'], ['hyacinth', 'Floral'], ['carnation', 'Floral'], ['chamomile', 'Floral'],
  ['petal', 'Floral'], ['wisteria', 'Floral'], ['jasmin', 'Floral'], ['champaca', 'Floral'],

  // Woody
  ['cedar', 'Woody'], ['sandalwood', 'Woody'], ['vetiver', 'Woody'], ['wood', 'Woody'],
  ['oak', 'Woody'], ['birch', 'Woody'], ['cypress', 'Woody'], ['pine', 'Woody'],
  ['fir', 'Woody'], ['guaiac', 'Woody'], ['teak', 'Woody'], ['ebony', 'Woody'],
  ['mahogany', 'Woody'], ['papyrus', 'Woody'], ['iso e', 'Woody'], ['patchouli', 'Woody'],
  ['moss', 'Woody'], ['cashmere wood', 'Woody'], ['akigala', 'Woody'],

  // Amber / balsamic / gourmand-sweet
  ['amber', 'Amber'], ['ambergris', 'Amber'], ['ambroxan', 'Amber'], ['labdanum', 'Amber'],
  ['benzoin', 'Amber'], ['resin', 'Amber'], ['balsam', 'Amber'], ['vanilla', 'Amber'],
  ['tonka', 'Amber'], ['opoponax', 'Amber'], ['myrrh', 'Amber'], ['frankincense', 'Amber'],
  ['caramel', 'Amber'], ['chocolate', 'Amber'], ['cacao', 'Amber'], ['coffee', 'Amber'],
  ['praline', 'Amber'], ['honey', 'Amber'], ['almond', 'Amber'], ['milk', 'Amber'],
  ['sugar', 'Amber'], ['rum', 'Amber'], ['cognac', 'Amber'], ['whiskey', 'Amber'],
  ['styrax', 'Amber'], ['elemi', 'Amber'],

  // Musky
  ['musk', 'Musky'], ['cashmeran', 'Musky'], ['ambrette', 'Musky'], ['animalic', 'Musky'],
  ['civet', 'Musky'],

  // Long-tail additions from dry-run unmatched report
  ['aldehyde', 'Fresh'], ['cypriol', 'Woody'], ['nagarmota', 'Woody'],
  ['cocoa', 'Amber'], ['beeswax', 'Amber'],
  ['lavandin', 'Aromatic'], ['angelica', 'Aromatic'], ['bay', 'Aromatic'],
  ['tiare', 'Floral'],
  ['mate', 'Green'], ['lentisk', 'Green'], ['hay', 'Green'], ['mastic', 'Green'],
  ['cedrat', 'Citrus'], ['clementine', 'Citrus'],
  ['fruit', 'Fruity'],
]

function classify(noteName: string): string | null {
  const n = noteName.toLowerCase()
  for (const [kw, accord] of RULES) {
    if (n.includes(kw)) return accord
  }
  return null
}

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no DB writes\n')

  // Fragrances that already have accords — never touched
  const withAccords = new Set<string>()
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('fragrance_accords').select('fragrance_id').range(from, from + 999)
    if (!data?.length) break
    data.forEach(r => withAccords.add(r.fragrance_id))
    if (data.length < 1000) break
  }
  console.log(`${withAccords.size} fragrances already have accords — skipping those`)

  // All note links with names
  const links: Array<{ fragrance_id: string; note: string }> = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('fragrance_notes')
      .select('fragrance_id, notes(name)')
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    for (const r of data) {
      const note = (r.notes as unknown as { name: string } | null)?.name
      if (note) links.push({ fragrance_id: r.fragrance_id, note })
    }
    if (data.length < 1000) break
  }
  console.log(`${links.length} note links loaded`)

  // Group per fragrance
  const byFrag = new Map<string, string[]>()
  for (const l of links) {
    if (withAccords.has(l.fragrance_id)) continue
    if (!byFrag.has(l.fragrance_id)) byFrag.set(l.fragrance_id, [])
    byFrag.get(l.fragrance_id)!.push(l.note)
  }
  console.log(`${byFrag.size} fragrances to derive accords for`)

  // Derive
  const rows: Array<{ fragrance_id: string; accord_name: string; percentage: number; color_hex: string }> = []
  let unmatched = 0, skippedThin = 0
  const unmatchedNotes = new Map<string, number>()

  for (const [fragId, notes] of byFrag) {
    const counts = new Map<string, number>()
    let matched = 0
    for (const note of notes) {
      const accord = classify(note)
      if (!accord) { unmatched++; unmatchedNotes.set(note, (unmatchedNotes.get(note) ?? 0) + 1); continue }
      counts.set(accord, (counts.get(accord) ?? 0) + 1)
      matched++
    }
    if (matched < 2) { skippedThin++; continue }

    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    const totalTop = top.reduce((s, [, c]) => s + c, 0)
    for (const [accord, count] of top) {
      rows.push({
        fragrance_id: fragId,
        accord_name:  accord,
        percentage:   Math.max(5, Math.round((count / totalTop) * 100)),
        color_hex:    ACCORD_COLORS[accord],
      })
    }
  }

  console.log(`\nDerived ${rows.length} accord rows across ${byFrag.size - skippedThin} fragrances`)
  console.log(`Skipped ${skippedThin} fragrances with <2 classifiable notes`)
  console.log(`${unmatched} note instances unmatched. Top unmatched notes:`)
  ;[...unmatchedNotes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([n, c]) => console.log(`   ${c}× ${n}`))

  if (DRY_RUN) { console.log('\nDry run — nothing written.'); return }

  // Insert in chunks
  let inserted = 0
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500)
    const { error } = await supabase.from('fragrance_accords').insert(chunk)
    if (error) throw new Error(`insert failed at ${i}: ${error.message}`)
    inserted += chunk.length
    process.stdout.write(`\rInserted ${inserted}/${rows.length}`)
  }
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
