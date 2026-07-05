// src/lib/db.ts
// Server-side data fetching functions using the Supabase server client.

import { createClient, createServiceClient } from './supabase/server'
import type { Fragrance, Note, Brand } from './types'

export interface UserRating {
  id: string
  score: number
  longevity: string | null
  sillage: string | null
  season: string[] | null
  recommend: boolean | null
  created_at: string
  fragrance: {
    id: string; slug: string; name: string
    image_url: string | null
    brand: { name: string; slug: string }
  }
}

type DbAccord = { accord_name: string; percentage: number; color_hex: string | null }
type DbNote   = { position: string; notes: { id: string; name: string; family: string } | null }
type DbPrice  = { id: string; size_ml: number; price: number; currency: string; affiliate_url: string | null; retailers: { id: string; name: string } | null }
type DbStats  = { id: string; avg_score: number | null; rating_count: number | null; recommend_pct: number | null; avg_longevity: number | null; avg_sillage: number | null; avg_gender: number | null; avg_price_value: number | null }

type DbFrag = {
  id: string; slug: string; name: string
  concentration: string | null; gender: string | null
  year: number | null; description: string | null; image_url: string | null
  perfumer: string | null; fw_classification: string | null
  concepts: string[] | null; origin: string | null; wikiparfum_slug: string | null
  brands: { id: string; slug: string; name: string; country: string | null } | null
  fragrance_accords: DbAccord[]
  fragrance_notes?: DbNote[]
  fragrance_prices?: DbPrice[]
}

function mapFragrance(row: DbFrag, stats?: DbStats): Fragrance {
  const notes = row.fragrance_notes ?? []
  const byPosition = (pos: string): Note[] =>
    notes
      .filter(n => n.position === pos && n.notes)
      .map(n => ({ id: n.notes!.id, name: n.notes!.name, family: n.notes!.family }))

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: {
      id:      row.brands?.id      ?? '',
      slug:    row.brands?.slug    ?? '',
      name:    row.brands?.name    ?? '',
      country: row.brands?.country ?? undefined,
    },
    description:   row.description   ?? undefined,
    year:          row.year          ?? undefined,
    concentration: row.concentration ?? undefined,
    gender:        (row.gender as Fragrance['gender']) ?? undefined,
    image_url:        row.image_url        ?? undefined,
    perfumer:         row.perfumer         ?? undefined,
    fw_classification: row.fw_classification ?? undefined,
    concepts:         row.concepts         ?? undefined,
    origin:           row.origin           ?? undefined,
    wikiparfum_slug:  row.wikiparfum_slug  ?? undefined,
    accords: row.fragrance_accords.map(a => ({
      name:       a.accord_name,
      percentage: a.percentage,
      color_hex:  a.color_hex ?? undefined,
    })),
    top_notes:   byPosition('top'),
    heart_notes: byPosition('heart'),
    base_notes:  byPosition('base'),
    flat_notes: notes
      .filter(n => n.notes)
      .map(n => ({ id: n.notes!.id, name: n.notes!.name, family: n.notes!.family })),
    avg_score:       stats?.avg_score       ?? undefined,
    rating_count:    stats?.rating_count   ?? undefined,
    recommend_pct:   stats?.recommend_pct  ?? undefined,
    avg_longevity:   stats?.avg_longevity  ?? undefined,
    avg_sillage:     stats?.avg_sillage    ?? undefined,
    avg_gender:      stats?.avg_gender     ?? undefined,
    avg_price_value: stats?.avg_price_value ?? undefined,
    prices: (row.fragrance_prices ?? [])
      .filter(p => p.retailers)
      .map(p => ({
        id:            p.id,
        retailer:      { id: p.retailers!.id, name: p.retailers!.name },
        size_ml:       p.size_ml,
        price:         p.price,
        currency:      p.currency,
        affiliate_url: p.affiliate_url ?? '#',
      })),
  }
}

async function getStats(ids: string[]): Promise<Map<string, DbStats>> {
  if (ids.length === 0) return new Map()
  const supabase = await createClient()
  const { data } = await supabase
    .from('fragrance_stats')
    .select('id, avg_score, rating_count, recommend_pct, avg_longevity, avg_sillage, avg_gender, avg_price_value')
    .in('id', ids)
  return new Map((data ?? []).map(s => [s.id, s]))
}

export async function getTopFragrances(limit = 20): Promise<Fragrance[]> {
  const supabase = await createClient()

  const { data: statsRows } = await supabase
    .from('fragrance_stats')
    .select('id, avg_score, rating_count, recommend_pct, avg_longevity, avg_sillage, avg_gender, avg_price_value')
    .gt('rating_count', 0)
    .order('rating_count', { ascending: false })
    .limit(limit)

  if (!statsRows?.length) {
    const { data } = await supabase
      .from('fragrances')
      .select(`id, slug, name, concentration, gender, year, description, image_url, brands(id, slug, name, country), fragrance_accords(accord_name, percentage, color_hex)`)
      .order('name')
      .limit(limit)
    return (data ?? []).map(f => mapFragrance(f as unknown as DbFrag))
  }

  const ids = statsRows.map(s => s.id)
  const { data } = await supabase
    .from('fragrances')
    .select(`id, slug, name, concentration, gender, year, description, image_url, brands(id, slug, name, country), fragrance_accords(accord_name, percentage, color_hex)`)
    .in('id', ids)

  const statsMap = new Map(statsRows.map(s => [s.id, s]))
  return (data ?? [])
    .sort((a, b) => (statsMap.get(b.id)?.rating_count ?? 0) - (statsMap.get(a.id)?.rating_count ?? 0))
    .map(f => mapFragrance(f as unknown as DbFrag, statsMap.get(f.id)))
}



export async function getFragranceBySlug(slug: string): Promise<Fragrance | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      id, slug, name, concentration, gender, year, description, image_url,
      perfumer, fw_classification, concepts, origin, wikiparfum_slug,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex),
      fragrance_notes(position, notes(id, name, family)),
      fragrance_prices(id, size_ml, price, currency, affiliate_url, retailers(id, name))
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  const [statsMap, dists] = await Promise.all([
    getStats([data.id]),
    getScaleDistributions(data.id),
  ])
  const frag = mapFragrance(data as unknown as DbFrag, statsMap.get(data.id))
  if (dists) frag.scale_dists = dists
  return frag
}

async function getScaleDistributions(fragranceId: string): Promise<Fragrance['scale_dists'] | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  let supabase: ReturnType<typeof createServiceClient>
  try { supabase = createServiceClient() } catch { return null }
  const { data } = await supabase!
    .from('ratings')
    .select('longevity_v2, sillage_v2, gender_rating, price_value')
    .eq('fragrance_id', fragranceId)
    .limit(5000)

  if (!data?.length) return null

  const lon = [0,0,0,0,0], sil = [0,0,0,0,0], gen = [0,0,0,0,0], pri = [0,0,0,0,0]
  let lc = 0, sc = 0, gc = 0, pc = 0

  for (const r of data) {
    if (r.longevity_v2  >= 1 && r.longevity_v2  <= 5) { lon[r.longevity_v2  - 1]++; lc++ }
    if (r.sillage_v2    >= 1 && r.sillage_v2    <= 5) { sil[r.sillage_v2    - 1]++; sc++ }
    if (r.gender_rating >= 1 && r.gender_rating <= 5)  { gen[r.gender_rating - 1]++; gc++ }
    if (r.price_value   >= 1 && r.price_value   <= 5)  { pri[r.price_value   - 1]++; pc++ }
  }

  const pct = (arr: number[], total: number) => arr.map(v => total > 0 ? Math.round(v / total * 100) : 0)
  if (!lc && !sc && !gc && !pc) return null

  return {
    longevity:   pct(lon, lc),
    sillage:     pct(sil, sc),
    gender:      pct(gen, gc),
    price_value: pct(pri, pc),
  }
}

export async function getFragrances(opts: {
  gender?: string
  accord?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
} = {}): Promise<{ fragrances: Fragrance[]; total: number }> {
  const supabase = await createClient()
  const { gender, accord, search, sort = 'name', page = 1, limit = 48 } = opts
  const from = (page - 1) * limit

  // Count query
  let countQ = supabase.from('fragrances').select('id', { count: 'exact', head: true })
  if (gender) countQ = countQ.eq('gender', gender)
  if (search) countQ = countQ.ilike('name', `%${search}%`)

  // Data query
  let dataQ = supabase
    .from('fragrances')
    .select(`
      id, slug, name, concentration, gender, year, description, image_url,
      perfumer, fw_classification, concepts, origin, wikiparfum_slug,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex)
    `)
    .range(from, from + limit - 1)

  if (gender) dataQ = dataQ.eq('gender', gender)
  if (search) dataQ = dataQ.ilike('name', `%${search}%`)
  if (sort === 'newest') dataQ = dataQ.order('year', { ascending: false, nullsFirst: false }).order('name')
  else dataQ = dataQ.order('name')

  // Accord filter: post-filter in JS (Supabase doesn't support nested filter easily)
  const [countRes, dataRes] = await Promise.all([countQ, dataQ])
  if (dataRes.error) { console.error('getFragrances:', dataRes.error.message); return { fragrances: [], total: 0 } }

  let rows = (dataRes.data ?? []) as unknown as DbFrag[]

  if (accord) {
    const needle = accord.toLowerCase()
    rows = rows.filter(f =>
      (f.fragrance_accords ?? []).some(a => a.accord_name.toLowerCase().includes(needle))
    )
  }

  const statsMap = await getStats(rows.map(f => f.id))
  return {
    fragrances: rows.map(f => mapFragrance(f, statsMap.get(f.id))),
    total: countRes.count ?? 0,
  }
}

export async function getAllFragranceSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('fragrances').select('slug')
  return (data ?? []).map(f => f.slug)
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('id, slug, name, country, description, logo_url')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    country: data.country ?? undefined,
    description: data.description ?? undefined,
    logo_url: data.logo_url ?? undefined,
  }
}

export async function getFragrancesByBrand(brandSlug: string, limit = 200): Promise<Fragrance[]> {
  const supabase = await createClient()

  const { data: brandRow } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .single()

  if (!brandRow) return []

  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      id, slug, name, concentration, gender, year, description, image_url,
      perfumer, fw_classification, concepts, origin, wikiparfum_slug,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex)
    `)
    .eq('brand_id', brandRow.id)
    .order('name')
    .limit(limit)

  if (error) { console.error('getFragrancesByBrand:', error.message); return [] }

  const rows = (data ?? []) as unknown as DbFrag[]
  const statsMap = await getStats(rows.map(f => f.id))
  return rows.map(f => mapFragrance(f, statsMap.get(f.id)))
}

export async function getAllBrandSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('brands').select('slug')
  return (data ?? []).map(b => b.slug)
}

export async function getAllBrands(): Promise<Brand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('id, slug, name, country')
    .order('name', { ascending: true })
  if (error) { console.error('getAllBrands:', error.message); return [] }
  return (data ?? []).map(b => ({
    id:      b.id,
    slug:    b.slug,
    name:    b.name,
    country: b.country ?? undefined,
  }))
}

export interface RedditStats {
  mention_count:      number
  avg_score:          number | null
  avg_sentiment:      number | null
  avg_longevity:      number | null
  avg_sillage:        number | null
  avg_gender:         number | null
  avg_price_value:    number | null
  mentions_this_month: number
  mentions_last_month: number
}

export async function getRedditStats(fragranceId: string): Promise<RedditStats | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fragrance_reddit_stats')
    .select('*')
    .eq('fragrance_id', fragranceId)
    .single()
  if (!data || (data.mention_count ?? 0) < 3) return null
  const n = (v: unknown) => v !== null && v !== undefined ? parseFloat(String(v)) : null
  return {
    mention_count:       data.mention_count       ?? 0,
    avg_score:           n(data.avg_score),
    avg_sentiment:       n(data.avg_sentiment),
    avg_longevity:       n(data.avg_longevity),
    avg_sillage:         n(data.avg_sillage),
    avg_gender:          n(data.avg_gender),
    avg_price_value:     n(data.avg_price_value),
    mentions_this_month: data.mentions_this_month ?? 0,
    mentions_last_month: data.mentions_last_month ?? 0,
  }
}

export interface TrendingFragrance extends Fragrance {
  mention_count:      number
  avg_reddit_score:   number | null
  avg_reddit_sentiment: number | null
  mentions_this_month: number
  mentions_last_month: number
}

export async function getTrendingByReddit(limit = 20): Promise<TrendingFragrance[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  const supabase = createServiceClient()

  const { data: redditRows } = await supabase
    .from('fragrance_reddit_stats')
    .select('fragrance_id, mention_count, avg_score, avg_sentiment, mentions_this_month, mentions_last_month')
    .gte('mention_count', 3)
    .order('mention_count', { ascending: false })
    .limit(limit)

  if (!redditRows?.length) return []
  const ids = redditRows.map(r => r.fragrance_id)

  const { data: frags } = await supabase
    .from('fragrances')
    .select(`id, slug, name, concentration, gender, year, description, image_url,
      perfumer, fw_classification, concepts, origin, wikiparfum_slug,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex)`)
    .in('id', ids)

  const statsMap = await getStats(ids)
  const redditMap = new Map(redditRows.map(r => [r.fragrance_id, r]))

  return (frags ?? []).map(f => {
    const r = redditMap.get(f.id)!
    const nn = (v: unknown) => v !== null && v !== undefined ? parseFloat(String(v)) : null
    return {
      ...mapFragrance(f as unknown as DbFrag, statsMap.get(f.id)),
      mention_count:        r.mention_count        ?? 0,
      avg_reddit_score:     nn(r.avg_score),
      avg_reddit_sentiment: nn(r.avg_sentiment),
      mentions_this_month:  r.mentions_this_month  ?? 0,
      mentions_last_month:  r.mentions_last_month  ?? 0,
    }
  }).sort((a, b) => b.mention_count - a.mention_count)
}

export async function getTopRatedFragrances(limit = 20): Promise<Fragrance[]> {
  const supabase = await createClient()
  const { data: statsRows } = await supabase
    .from('fragrance_stats')
    .select('id, avg_score, rating_count, recommend_pct, avg_longevity, avg_sillage, avg_gender, avg_price_value')
    .gte('rating_count', 1)
    .order('avg_score', { ascending: false })
    .limit(limit)
  if (!statsRows?.length) return []
  const ids = statsRows.map(s => s.id)
  const { data } = await supabase
    .from('fragrances')
    .select(`id, slug, name, concentration, gender, year, description, image_url,
      perfumer, fw_classification, concepts, origin, wikiparfum_slug,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex)`)
    .in('id', ids)
  const statsMap = new Map(statsRows.map(s => [s.id, s]))
  return (data ?? [])
    .sort((a, b) => (statsMap.get(b.id)?.avg_score ?? 0) - (statsMap.get(a.id)?.avg_score ?? 0))
    .map(f => mapFragrance(f as unknown as DbFrag, statsMap.get(f.id)))
}

export async function getUserRatings(userId: string): Promise<UserRating[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ratings')
    .select(`id, score, longevity, sillage, season, recommend, created_at,
      fragrances(id, slug, name, image_url, brands(name, slug))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('getUserRatings:', error.message); return [] }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    score: r.score,
    longevity: r.longevity,
    sillage: r.sillage,
    season: r.season,
    recommend: r.recommend,
    created_at: r.created_at,
    fragrance: {
      id:       r.fragrances?.id    ?? '',
      slug:     r.fragrances?.slug  ?? '',
      name:     r.fragrances?.name  ?? '',
      image_url: r.fragrances?.image_url ?? null,
      brand: {
        name: r.fragrances?.brands?.name ?? '',
        slug: r.fragrances?.brands?.slug ?? '',
      },
    },
  }))
}

// ── Classification stats ─────────────────────────────────────────────────────

export interface ClassificationStats {
  season_votes:   number
  occasion_votes: number
  style_votes:    number
  season:   { spring: number; summer: number; autumn: number; winter: number }
  occasion: { daily: number; office: number; evening: number; sport: number; formal: number; date: number }
  style:    { fresh: number; elegant: number; casual: number; sporty: number; romantic: number; bold: number; dark: number; cozy: number }
}

export async function getClassificationStats(fragranceId: string): Promise<ClassificationStats | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fragrance_classification_stats')
    .select('*')
    .eq('fragrance_id', fragranceId)
    .single()
  if (!data) return null
  const n = (v: unknown) => v !== null && v !== undefined ? Number(v) : 0
  return {
    season_votes:   n(data.season_votes),
    occasion_votes: n(data.occasion_votes),
    style_votes:    n(data.style_votes),
    season:   { spring: n(data.spring_pct), summer: n(data.summer_pct), autumn: n(data.autumn_pct), winter: n(data.winter_pct) },
    occasion: { daily: n(data.occ_daily_pct), office: n(data.occ_office_pct), evening: n(data.occ_evening_pct), sport: n(data.occ_sport_pct), formal: n(data.occ_formal_pct), date: n(data.occ_date_pct) },
    style:    { fresh: n(data.style_fresh_pct), elegant: n(data.style_elegant_pct), casual: n(data.style_casual_pct), sporty: n(data.style_sporty_pct), romantic: n(data.style_romantic_pct), bold: n(data.style_bold_pct), dark: n(data.style_dark_pct), cozy: n(data.style_cozy_pct) },
  }
}

// ── Statements ───────────────────────────────────────────────────────────────

export interface Statement {
  id:              string
  body:            string
  score_scent:     number | null
  score_longevity: number | null
  score_sillage:   number | null
  is_positive:     boolean | null
  created_at:      string
}

export async function getStatements(fragranceId: string, limit = 8): Promise<Statement[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return []
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('fragrance_statements')
    .select('id, body, score_scent, score_longevity, score_sillage, is_positive, created_at')
    .eq('fragrance_id', fragranceId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(s => ({
    id:              s.id,
    body:            s.body,
    score_scent:     s.score_scent     ?? null,
    score_longevity: s.score_longevity ?? null,
    score_sillage:   s.score_sillage   ?? null,
    is_positive:     s.is_positive     ?? null,
    created_at:      s.created_at,
  }))
}

function cosineSim(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, magA = 0, magB = 0
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const av = a[k] ?? 0, bv = b[k] ?? 0
    dot += av * bv; magA += av * av; magB += bv * bv
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0
}

export async function getDupes(fragranceId: string, limit = 6): Promise<Array<Fragrance & { similarity: number }>> {
  const supabase = await createClient()

  const { data: targetAccords } = await supabase
    .from('fragrance_accords')
    .select('accord_name, percentage')
    .eq('fragrance_id', fragranceId)
  if (!targetAccords?.length) return []

  const targetVec: Record<string, number> = {}
  for (const a of targetAccords) targetVec[a.accord_name] = a.percentage
  const topNames = Object.entries(targetVec).sort((a,b) => b[1]-a[1]).slice(0,3).map(a=>a[0])

  const { data: candidateRows } = await supabase
    .from('fragrance_accords')
    .select('fragrance_id')
    .in('accord_name', topNames)
    .neq('fragrance_id', fragranceId)
  const candidateIds = [...new Set((candidateRows ?? []).map(c => c.fragrance_id))].slice(0, 150)
  if (!candidateIds.length) return []

  const { data: allAccords } = await supabase
    .from('fragrance_accords')
    .select('fragrance_id, accord_name, percentage')
    .in('fragrance_id', candidateIds)

  const vecs: Record<string, Record<string, number>> = {}
  for (const a of allAccords ?? []) {
    if (!vecs[a.fragrance_id]) vecs[a.fragrance_id] = {}
    vecs[a.fragrance_id][a.accord_name] = a.percentage
  }

  const ranked = Object.entries(vecs)
    .map(([id, vec]) => ({ id, sim: cosineSim(targetVec, vec) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit)

  const topIds = ranked.map(r => r.id)
  const { data: frags } = await supabase
    .from('fragrances')
    .select(`id, slug, name, concentration, gender, year, description, image_url,
      perfumer, fw_classification, concepts, origin, wikiparfum_slug,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex)`)
    .in('id', topIds)

  const simMap = new Map(ranked.map(r => [r.id, Math.round(r.sim * 100)]))
  const statsMap = await getStats(topIds)
  return (frags ?? [])
    .map(f => ({ ...mapFragrance(f as unknown as DbFrag, statsMap.get(f.id)), similarity: simMap.get(f.id) ?? 0 }))
    .sort((a, b) => b.similarity - a.similarity)
}
