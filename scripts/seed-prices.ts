// scripts/seed-prices.ts
// Seeds UK retailer price data for all fragrances.
// Run with: npx tsx scripts/seed-prices.ts

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { FRAGRANCES } from './seed-data'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Retailers ─────────────────────────────────────────────────────────────────

const RETAILERS = [
  { slug: 'fragrance-direct',   name: 'Fragrance Direct',   url: 'https://www.fragrancedirect.co.uk' },
  { slug: 'the-fragrance-shop', name: 'The Fragrance Shop', url: 'https://www.thefragranceshop.co.uk' },
  { slug: 'lookfantastic',      name: 'Lookfantastic',      url: 'https://www.lookfantastic.com' },
  { slug: 'boots',              name: 'Boots',              url: 'https://www.boots.com' },
  { slug: 'john-lewis',         name: 'John Lewis',         url: 'https://www.johnlewis.com' },
  { slug: 'selfridges',         name: 'Selfridges',         url: 'https://www.selfridges.com' },
  { slug: 'harrods',            name: 'Harrods',            url: 'https://www.harrods.com' },
  { slug: 'asos',               name: 'ASOS',               url: 'https://www.asos.com' },
]

// ── Price tiers (GBP per 100ml equivalent) ────────────────────────────────────

type Tier = 'mass' | 'popular' | 'designer' | 'prestige' | 'luxury'

const TIER_BASE: Record<Tier, number> = {
  mass:     42,
  popular:  72,
  designer: 110,
  prestige: 185,
  luxury:   295,
}

// Multiplier vs 100ml base
const SIZE_MULT: Record<number, number> = {
  30:  0.43,
  35:  0.50,
  50:  0.60,
  60:  0.72,
  75:  0.78,
  85:  0.88,
  90:  0.92,
  100: 1.00,
  120: 1.15,
  125: 1.18,
  150: 1.32,
  175: 1.48,
  180: 1.54,
  200: 1.65,
}

// Retailer discount from RRP (negative = markup vs RRP)
const RETAILER_DISCOUNT: Record<string, number> = {
  'fragrance-direct':   0.22,
  'the-fragrance-shop': 0.17,
  'lookfantastic':      0.13,
  'asos':               0.10,
  'boots':              0.08,
  'john-lewis':         0.02,
  'selfridges':        -0.02,
  'harrods':           -0.05,
}

// ── Fragrance config ──────────────────────────────────────────────────────────

function getTier(slug: string): Tier {
  if (
    slug.startsWith('roja-dove') || slug.startsWith('kilian') ||
    slug.startsWith('xerjoff')
  ) return 'luxury'

  if (
    slug.startsWith('creed') || slug.startsWith('mfk') ||
    slug.startsWith('le-labo') || slug.startsWith('pdm') ||
    slug.startsWith('amouage') || slug.startsWith('byredo') ||
    slug.startsWith('initio') || slug.startsWith('nishane') ||
    slug.startsWith('diptyque') || slug.startsWith('penhaligons') ||
    slug.startsWith('mancera') || slug.startsWith('montale') ||
    slug.startsWith('jo-malone') || slug.startsWith('adp') ||
    slug.startsWith('frederic-malle')
  ) return 'prestige'

  if (
    slug.startsWith('tom-ford') || slug.startsWith('chanel') ||
    slug.startsWith('guerlain') || slug.startsWith('hermes') ||
    slug.startsWith('givenchy') || slug.startsWith('chloe') ||
    slug.startsWith('lancome') || slug.startsWith('gucci') ||
    slug.startsWith('valentino') || slug.startsWith('bvlgari')
  ) return 'designer'

  if (
    slug.startsWith('dior') || slug.startsWith('ysl') ||
    slug.startsWith('armani') || slug.startsWith('paco-rabanne') ||
    slug.startsWith('viktor-rolf') || slug.startsWith('jpgaultier') ||
    slug.startsWith('mugler') || slug.startsWith('versace') ||
    slug.startsWith('dg') || slug.startsWith('narciso') ||
    slug.startsWith('carolina-herrera') || slug.startsWith('marc-jacobs') ||
    slug.startsWith('burberry') || slug.startsWith('issey-miyake') ||
    slug.startsWith('ralph-lauren')
  ) return 'popular'

  return 'mass' // hugo-boss, davidoff, montblanc, ck
}

// Standard sizes per tier (ml)
function getDefaultSizes(tier: Tier): number[] {
  switch (tier) {
    case 'mass':     return [30, 100, 200]
    case 'popular':  return [30, 50, 100, 200]
    case 'designer': return [30, 50, 75, 100]
    case 'prestige': return [50, 100, 200]
    case 'luxury':   return [50, 100]
  }
}

// Non-standard size overrides
const SIZE_OVERRIDES: Record<string, number[]> = {
  'mfk-baccarat-rouge-540':           [35, 70, 200],
  'mfk-grand-soir':                   [70, 200],
  'mfk-amyris-homme':                 [100, 200],
  'chanel-no5-edp':                   [35, 50, 100, 200],
  'pdm-layton':                       [75, 125],
  'pdm-pegasus':                      [75, 125],
  'pdm-herod':                        [75, 125],
  'jo-malone-peony-blush-suede':      [30, 100, 175],
  'jo-malone-wood-sage-sea-salt':     [30, 100, 175],
  'jo-malone-lime-basil-mandarin':    [30, 100, 175],
  'le-labo-santal-33':                [50, 100],
  'le-labo-rose-31':                  [50, 100],
  'le-labo-another-13':               [50, 100],
  'frederic-malle-portrait-of-a-lady':[50, 100],
  'kilian-black-phantom':             [50],
  'kilian-love-dont-be-shy':          [50],
  'roja-dove-elysium':                [50, 100],
  'xerjoff-naxos':                    [50, 100],
  'penhaligons-halfeti':              [75, 100],
  'amouage-reflection-man':           [50, 100],
  'amouage-interlude-man':            [50, 100],
  'initio-oud-for-greatness':         [90],
  'initio-absolute-aphrodisiac':      [90],
  'nishane-hacivat':                  [50, 100],
  'nishane-ani':                      [50, 100],
  'byredo-gypsy-water':               [50, 100],
  'byredo-bal-dafrique':              [50, 100],
  'byredo-mojave-ghost':              [50, 100],
  'diptyque-philosykos':              [75, 100],
  'diptyque-tam-dao':                 [75, 100],
  'mancera-cedrat-boise':             [60, 120],
  'mancera-roses-vanille':            [60, 120],
  'adp-colonia':                      [50, 100, 180],
  'adp-magnolia-nobile':              [50, 100],
  'hermes-terre-dhermes':             [50, 75, 100],
  'hermes-un-jardin-sur-le-nil':      [50, 100],
  'hermes-twilly-dhermes':            [30, 50, 85],
  'montale-black-aoud':               [50, 100],
}

// Which retailers carry each tier (mass/popular get discount retailers; prestige/luxury skew premium)
function getRetailers(tier: Tier): string[] {
  switch (tier) {
    case 'mass':
    case 'popular':
      return ['fragrance-direct', 'the-fragrance-shop', 'lookfantastic', 'asos', 'boots', 'john-lewis']
    case 'designer':
      return ['fragrance-direct', 'the-fragrance-shop', 'lookfantastic', 'boots', 'john-lewis', 'selfridges']
    case 'prestige':
      return ['fragrance-direct', 'the-fragrance-shop', 'john-lewis', 'selfridges', 'harrods']
    case 'luxury':
      return ['the-fragrance-shop', 'john-lewis', 'selfridges', 'harrods']
  }
}

function calcPrice(tier: Tier, sizeMl: number, retailerSlug: string): number {
  const base = TIER_BASE[tier] * (SIZE_MULT[sizeMl] ?? sizeMl / 100)
  const discount = RETAILER_DISCOUNT[retailerSlug] ?? 0
  return Math.max(5, Math.round(base * (1 - discount)))
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seedPrices() {
  console.log('Seeding retailers...')

  const { error: rErr } = await supabase
    .from('retailers')
    .upsert(RETAILERS.map(r => ({ slug: r.slug, name: r.name })), { onConflict: 'slug' })
  if (rErr) throw new Error(`retailers: ${rErr.message}`)

  const { data: retailerRows } = await supabase.from('retailers').select('id, slug')
  const retailerIdBySlug: Record<string, string> = {}
  for (const r of retailerRows!) retailerIdBySlug[r.slug] = r.id
  console.log(`  ✓ ${RETAILERS.length} retailers`)

  const { data: fragRows } = await supabase.from('fragrances').select('id, slug')
  const fragIdBySlug: Record<string, string> = {}
  for (const f of fragRows!) fragIdBySlug[f.slug] = f.id

  const priceRows: {
    fragrance_id: string; retailer_id: string
    size_ml: number; price: number; currency: string; affiliate_url: string
  }[] = []

  for (const frag of FRAGRANCES) {
    const fragId = fragIdBySlug[frag.slug]
    if (!fragId) continue

    const tier      = getTier(frag.slug)
    const sizes     = SIZE_OVERRIDES[frag.slug] ?? getDefaultSizes(tier)
    const retailers = getRetailers(tier)

    for (const sizeMl of sizes) {
      for (const retailerSlug of retailers) {
        const retailerId = retailerIdBySlug[retailerSlug]
        if (!retailerId) continue

        const retailer = RETAILERS.find(r => r.slug === retailerSlug)!
        const price    = calcPrice(tier, sizeMl, retailerSlug)
        const nameSlug = frag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const url      = `${retailer.url}/search?q=${encodeURIComponent(frag.name)}`

        priceRows.push({ fragrance_id: fragId, retailer_id: retailerId, size_ml: sizeMl, price, currency: 'GBP', affiliate_url: url })
      }
    }
  }

  console.log(`Upserting ${priceRows.length} price records...`)

  // Insert in batches of 500 to avoid request size limits
  for (let i = 0; i < priceRows.length; i += 500) {
    const batch = priceRows.slice(i, i + 500)
    const { error } = await supabase.from('fragrance_prices').upsert(batch)
    if (error) throw new Error(`prices batch ${i}: ${error.message}`)
  }

  console.log(`  ✓ ${priceRows.length} prices seeded`)
  console.log('\nDone.')
}

seedPrices().catch(err => { console.error(err.message); process.exit(1) })
