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
type DbStats  = { id: string; avg_score: number | null; rating_count: number | null; recommend_pct: number | null }

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
    avg_score:     stats?.avg_score      ?? undefined,
    rating_count:  stats?.rating_count   ?? undefined,
    recommend_pct: stats?.recommend_pct  ?? undefined,
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
    .select('id, avg_score, rating_count, recommend_pct')
    .in('id', ids)
  return new Map((data ?? []).map(s => [s.id, s]))
}

export async function getTopFragrances(limit = 20): Promise<Fragrance[]> {
  const supabase = await createClient()

  const { data: statsRows } = await supabase
    .from('fragrance_stats')
    .select('id, avg_score, rating_count, recommend_pct')
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

async function getFragranceDistributions(fragranceId: string): Promise<{
  longevity_dist: Record<string, number>
  sillage_dist: Record<string, number>
  season_dist: Record<string, number>
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ratings')
    .select('longevity, sillage, season')
    .eq('fragrance_id', fragranceId)
    .limit(2000)

  if (!data?.length) return { longevity_dist: {}, sillage_dist: {}, season_dist: {} }

  const lonCounts: Record<string, number> = {}
  const silCounts: Record<string, number> = {}
  const seaCounts: Record<string, number> = {}

  for (const r of data) {
    if (r.longevity) lonCounts[r.longevity] = (lonCounts[r.longevity] ?? 0) + 1
    if (r.sillage)  silCounts[r.sillage]  = (silCounts[r.sillage]  ?? 0) + 1
    if (Array.isArray(r.season)) {
      for (const s of r.season) seaCounts[s] = (seaCounts[s] ?? 0) + 1
    }
  }

  const toPct = (counts: Record<string, number>, total: number) => {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(counts)) out[k] = Math.round(v / total * 100)
    return out
  }

  const seaTotal = Object.values(seaCounts).reduce((a, b) => a + b, 0)
  return {
    longevity_dist: toPct(lonCounts, data.length),
    sillage_dist:   toPct(silCounts, data.length),
    season_dist:    toPct(seaCounts, seaTotal || 1),
  }
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

  const statsMap = await getStats([data.id])
  const dists = await getFragranceDistributions(data.id)
  const frag = mapFragrance(data as unknown as DbFrag, statsMap.get(data.id))
  frag.longevity_dist = dists.longevity_dist
  frag.sillage_dist   = dists.sillage_dist
  ;(frag as any).season_dist = dists.season_dist
  return frag
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

export async function getUserRatings(userId: string): Promise<UserRating[]> {
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
