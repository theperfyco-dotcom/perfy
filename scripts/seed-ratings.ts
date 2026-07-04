// scripts/seed-ratings.ts
// Seeds realistic demo ratings for popular fragrances
// Run with: npx tsx scripts/seed-ratings.ts

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

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

// ── Helpers ────────────────────────────────────────────────────────────────

/** Box-Muller: normal distribution sample, clamped to [1, 10] and rounded */
function normalScore(mean: number, stddev = 1.2): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.min(10, Math.max(1, Math.round(mean + z * stddev)))
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomFromOrNull<T>(arr: T[], nullChance = 0.3): T | null {
  if (Math.random() < nullChance) return null
  return randomFrom(arr)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Spread created_at over last 3 years */
function randomCreatedAt(): string {
  const now  = Date.now()
  const threeYearsAgo = now - 3 * 365 * 24 * 60 * 60 * 1000
  return new Date(threeYearsAgo + Math.random() * (now - threeYearsAgo)).toISOString()
}

// ── Rating option pools ────────────────────────────────────────────────────
// Values must match the CHECK constraints in supabase/schema.sql

const LONGEVITY_OPTIONS = ['under-4hrs', '4-8hrs', '8-12hrs', '12-24hrs', '24hrs+']
const SILLAGE_OPTIONS   = ['intimate', 'soft', 'moderate', 'strong', 'enormous']
const SEASON_OPTIONS    = ['spring', 'summer', 'autumn', 'winter']

/** Generate a random season array (1–2 seasons, 25% chance of null) */
function randomSeasons(): string[] | null {
  if (Math.random() < 0.25) return null
  const shuffled = [...SEASON_OPTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.random() < 0.5 ? 1 : 2)
}

/** Whether user would recommend — higher for iconic frags (higher mean scores) */
function randomRecommend(score: number): boolean | null {
  if (Math.random() < 0.15) return null
  return score >= 7
}

// ── Famous fragrances config ───────────────────────────────────────────────

/** name fragment → { targetMean, ratingCount range } */
interface FragConfig {
  nameFragment: string
  exact?: boolean          // if true, match whole name (case-insensitive)
  targetMean: number
  minRatings: number
  maxRatings: number
}

const ICONIC_FRAGS: FragConfig[] = [
  // Iconic tier — beloved across fragrance community
  { nameFragment: 'Aventus',             exact: true, targetMean: 8.6, minRatings: 180, maxRatings: 200 },
  { nameFragment: 'Baccarat Rouge 540',  exact: true, targetMean: 8.4, minRatings: 150, maxRatings: 200 },
  { nameFragment: 'Sauvage',             exact: true, targetMean: 8.0, minRatings: 180, maxRatings: 200 },
  { nameFragment: 'Black Opium',         exact: true, targetMean: 8.1, minRatings: 160, maxRatings: 190 },
  { nameFragment: 'Bleu de Chanel',      exact: true, targetMean: 8.2, minRatings: 150, maxRatings: 190 },
  { nameFragment: 'Good Girl',           exact: true, targetMean: 8.0, minRatings: 130, maxRatings: 180 },
  { nameFragment: '1 Million',           exact: true, targetMean: 7.9, minRatings: 140, maxRatings: 180 },
  { nameFragment: 'Black Orchid',        exact: true, targetMean: 8.3, minRatings: 130, maxRatings: 170 },
  { nameFragment: 'INVICTUS',            exact: true, targetMean: 7.8, minRatings: 130, maxRatings: 170 },
  { nameFragment: 'Angel',               exact: true, targetMean: 7.8, minRatings: 140, maxRatings: 180 },
  // Well-known classics
  { nameFragment: 'Armani Code',         exact: true, targetMean: 7.4, minRatings: 100, maxRatings: 160 },
  { nameFragment: 'Light Blue',          exact: true, targetMean: 7.3, minRatings: 110, maxRatings: 160 },
  { nameFragment: 'Fahrenheit',          exact: true, targetMean: 7.6, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'Shalimar',            exact: true, targetMean: 7.5, minRatings: 90,  maxRatings: 140 },
  { nameFragment: 'Boss Bottled',        exact: true, targetMean: 7.1, minRatings: 80,  maxRatings: 130 },
  { nameFragment: 'ck ONE',              exact: true, targetMean: 6.8, minRatings: 80,  maxRatings: 130 },
  { nameFragment: 'Eternity',            exact: true, targetMean: 6.9, minRatings: 80,  maxRatings: 130 },
  { nameFragment: 'Polo Blue',           exact: true, targetMean: 7.0, minRatings: 80,  maxRatings: 120 },
  { nameFragment: 'GUCCI GUILTY BLACK',  exact: true, targetMean: 7.2, minRatings: 80,  maxRatings: 120 },
  // Searched by partial name
  { nameFragment: 'TOBACCO VANILLE',     exact: true, targetMean: 8.5, minRatings: 120, maxRatings: 170 },
  { nameFragment: 'OUD WOOD',            exact: true, targetMean: 8.2, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'LOST CHERRY',         exact: true, targetMean: 8.0, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'COCO MADEMOISELLE',   exact: true, targetMean: 8.1, minRatings: 130, maxRatings: 170 },
  { nameFragment: 'CHANCE EAU TENDRE',   exact: true, targetMean: 7.8, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'LA VIE EST BELLE',    exact: true, targetMean: 7.9, minRatings: 120, maxRatings: 170 },
  { nameFragment: 'ACQUA DI GIÒ EAU DE TOILETTE', exact: false, targetMean: 7.4, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'VERSACE EROS',        exact: false, targetMean: 7.6, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'DIOR HOMME',          exact: false, targetMean: 7.7, minRatings: 100, maxRatings: 150 },
  { nameFragment: 'N°5',                 exact: false, targetMean: 7.8, minRatings: 110, maxRatings: 160 },
  { nameFragment: 'NEROLI PORTOFINO',    exact: true,  targetMean: 8.0, minRatings: 90,  maxRatings: 130 },
]

// ── Main ───────────────────────────────────────────────────────────────────

async function seedRatings() {
  console.log('Seeding demo ratings...\n')

  // 1. Resolve fragrance IDs from DB
  const resolved: Array<{ id: string; name: string; mean: number; minR: number; maxR: number }> = []

  for (const cfg of ICONIC_FRAGS) {
    const q = supabase
      .from('fragrances')
      .select('id, name')
      .limit(1)

    const { data, error } = cfg.exact
      ? await q.ilike('name', cfg.nameFragment)
      : await q.ilike('name', `%${cfg.nameFragment}%`)

    if (error || !data?.length) {
      console.log(`  ! Not found: "${cfg.nameFragment}"`)
      continue
    }

    resolved.push({
      id:   data[0].id,
      name: data[0].name,
      mean: cfg.targetMean,
      minR: cfg.minRatings,
      maxR: cfg.maxRatings,
    })
  }

  // 2. If we have fewer than 30 resolved, pad with image fragrances not already in the list
  if (resolved.length < 30) {
    const existingIds = new Set(resolved.map(r => r.id))
    const { data: extras } = await supabase
      .from('fragrances')
      .select('id, name')
      .not('image_url', 'is', null)
      .order('name')
      .limit(100)

    for (const f of extras ?? []) {
      if (existingIds.has(f.id)) continue
      resolved.push({ id: f.id, name: f.name, mean: 7.0, minR: 50, maxR: 100 })
      if (resolved.length >= 30) break
    }
  }

  console.log(`Resolved ${resolved.length} fragrances to seed\n`)

  let totalInserted = 0

  // 3. For each fragrance, check existing ratings and insert the difference
  for (const frag of resolved) {
    const { count: existing } = await supabase
      .from('ratings')
      .select('id', { count: 'exact', head: true })
      .eq('fragrance_id', frag.id)

    const existingCount = existing ?? 0
    const targetCount = randomInt(frag.minR, frag.maxR)

    if (existingCount >= frag.minR) {
      console.log(`  ✓ ${frag.name} — already has ${existingCount} ratings, skipping`)
      continue
    }

    const toInsert = targetCount - existingCount

    // Build batch rows
    const rows = Array.from({ length: toInsert }, () => {
      const score = normalScore(frag.mean)
      return {
        fragrance_id: frag.id,
        score,
        user_id:      null,
        longevity:    randomFromOrNull(LONGEVITY_OPTIONS, 0.2),
        sillage:      randomFromOrNull(SILLAGE_OPTIONS, 0.2),
        season:       randomSeasons(),
        recommend:    randomRecommend(score),
        review_text:  null,
        gender_vote:  randomFromOrNull(['masculine', 'feminine', 'unisex'], 0.4),
        created_at:   randomCreatedAt(),
      }
    })

    // Batch insert in chunks of 500
    const CHUNK = 500
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      const { error } = await supabase.from('ratings').insert(chunk)
      if (error) {
        console.error(`  ✗ ${frag.name}: ${error.message}`)
        break
      }
    }

    totalInserted += toInsert
    const avg = (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(2)
    console.log(`  ✓ ${frag.name} — inserted ${toInsert} ratings (avg score ${avg})`)
  }

  console.log(`\nTotal ratings inserted: ${totalInserted}`)

  // 4. Verify fragrance_stats view
  console.log('\nVerifying fragrance_stats view...')
  const fragranceIds = resolved.map(r => r.id)
  const { data: stats, error: sErr } = await supabase
    .from('fragrance_stats')
    .select('id, name, rating_count, avg_score, recommend_pct')
    .in('id', fragranceIds)
    .order('avg_score', { ascending: false })
    .limit(10)

  if (sErr) {
    console.error('fragrance_stats query error:', sErr.message)
  } else {
    console.log('\nTop 10 by avg_score:')
    for (const s of stats ?? []) {
      const pct = s.recommend_pct != null ? `${Math.round(s.recommend_pct)}% rec` : 'n/a'
      console.log(`  ${s.name.padEnd(40)} | avg ${(s.avg_score ?? 0).toFixed(2)} | ${s.rating_count} ratings | ${pct}`)
    }
  }

  console.log('\nDone!')
}

seedRatings().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
