// scripts/reddit-backfill.ts
// Drives the reddit-ingest endpoint one fragrance at a time for fragrances
// from brands the community actually discusses, so Reddit coverage grows
// beyond the initial 35 without waiting for the daily cron.
//
// Requires the dev server running on localhost:3000.
//
// Run:    npx tsx scripts/reddit-backfill.ts
// Limit:  npx tsx scripts/reddit-backfill.ts --limit=50

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'

config({ path: '.env.local' })

const LIMIT = (() => {
  const f = process.argv.find(a => a.startsWith('--limit='))
  return f ? parseInt(f.split('=')[1], 10) : 150
})()

const BASE   = 'http://localhost:3000'
const SECRET = process.env.CRON_SECRET ?? ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Fragrances processed in previous runs (including zero-post ones, which never
// appear in fragrance_reddit_stats) — skip them across runs.
const DONE_FILE = 'scripts/.reddit-backfill-done.json'
function loadDone(): Set<string> {
  try { return new Set(JSON.parse(readFileSync(DONE_FILE, 'utf8')) as string[]) } catch { return new Set() }
}
function saveDone(ids: Set<string>) {
  try { writeFileSync(DONE_FILE, JSON.stringify([...ids])) } catch { /* noop */ }
}

// Brands with real Reddit discussion volume — designer staples + niche darlings
const PRIORITY_BRANDS = [
  'dior', 'chanel', 'creed', 'tom ford', 'yves saint laurent', 'giorgio armani',
  'jean paul gaultier', 'paco rabanne', 'rabanne', 'versace', 'prada', 'valentino',
  'viktor & rolf', 'carolina herrera', 'dolce & gabbana', 'hugo boss', 'burberry',
  'gucci', 'hermès', 'hermes', 'guerlain', 'givenchy', 'lancôme', 'lancome',
  'mugler', 'montblanc', 'issey miyake', 'acqua di parma', 'jo malone',
  'maison francis kurkdjian', 'parfums de marly', 'initio', 'xerjoff', 'amouage',
  'byredo', 'le labo', 'diptyque', 'memo paris', "penhaligon", 'roja',
  'mancera', 'montale', 'nishane', 'serge lutens', 'chloé', 'chloe',
  'narciso rodriguez', 'marc jacobs', 'kilian', 'zara', 'lattafa', 'armaf',
  'calvin klein', 'ralph lauren', 'azzaro', 'davidoff', 'clean',
]

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  // Fragrances from priority brands, with images, not yet analysed
  const { data: brands } = await supabase.from('brands').select('id, name')
  const priorityBrandIds = (brands ?? [])
    .filter(b => PRIORITY_BRANDS.some(p => b.name.toLowerCase().includes(p)))
    .map(b => b.id)
  console.log(`${priorityBrandIds.length} priority brands matched`)

  const { data: analysed } = await supabase.from('fragrance_reddit_stats').select('fragrance_id')
  const done = loadDone()
  for (const r of analysed ?? []) done.add(r.fragrance_id)

  const candidates: Array<{ id: string; name: string }> = []
  for (let i = 0; i < priorityBrandIds.length; i += 40) {
    const { data } = await supabase
      .from('fragrances')
      .select('id, name')
      .in('brand_id', priorityBrandIds.slice(i, i + 40))
      .not('image_url', 'is', null)
      .order('name')
    for (const f of data ?? []) {
      if (!done.has(f.id)) candidates.push(f)
    }
  }
  const targets = candidates.slice(0, LIMIT)
  console.log(`${candidates.length} candidates, processing ${targets.length}\n`)

  let inserted = 0, errors = 0
  for (let i = 0; i < targets.length; i++) {
    const f = targets[i]
    process.stdout.write(`[${i + 1}/${targets.length}] ${f.name.slice(0, 44)} … `)
    try {
      const res = await fetch(`${BASE}/api/admin/reddit-ingest?fragrance_id=${f.id}&secret=${encodeURIComponent(SECRET)}`)
      const json = await res.json() as { stats?: { posts: number; inserted: number }; error?: string; message?: string }
      if (json.error) { console.log(`ERR ${json.error}`); errors++ }
      else if (json.stats) { console.log(`${json.stats.posts} posts, ${json.stats.inserted} sentiments`); inserted += json.stats.inserted }
      else console.log(json.message ?? 'no stats')
    } catch (e) {
      console.log(`FETCH ERR ${(e as Error).message}`)
      errors++
    }
    done.add(f.id)
    saveDone(done)
    await sleep(4000)
  }
  console.log(`\nDone: ${inserted} sentiments inserted, ${errors} errors`)
}

main().catch(e => { console.error(e); process.exit(1) })
