// src/lib/db.ts
// Server-side data fetching functions using the Supabase server client.

import { createClient } from './supabase/server'
import type { Fragrance, Note } from './types'

type DbAccord = { accord_name: string; percentage: number; color_hex: string | null }
type DbNote   = { position: string; notes: { id: string; name: string; family: string } | null }
type DbPrice  = { id: string; size_ml: number; price: number; currency: string; affiliate_url: string | null; retailers: { id: string; name: string } | null }
type DbStats  = { id: string; avg_score: number | null; rating_count: number | null; recommend_pct: number | null }

type DbFrag = {
  id: string; slug: string; name: string
  concentration: string | null; gender: string | null
  year: number | null; description: string | null; image_url: string | null
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
    image_url:     row.image_url     ?? undefined,
    accords: row.fragrance_accords.map(a => ({
      name:       a.accord_name,
      percentage: a.percentage,
      color_hex:  a.color_hex ?? undefined,
    })),
    top_notes:   byPosition('top'),
    heart_notes: byPosition('heart'),
    base_notes:  byPosition('base'),
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

  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      id, slug, name, concentration, gender, year, description, image_url,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex)
    `)
    .limit(limit)

  if (error) { console.error('getTopFragrances:', error.message); return [] }

  const statsMap = await getStats((data ?? []).map(f => f.id))
  return (data ?? []).map(f => mapFragrance(f as unknown as DbFrag, statsMap.get(f.id)))
}

export async function getFragranceBySlug(slug: string): Promise<Fragrance | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fragrances')
    .select(`
      id, slug, name, concentration, gender, year, description, image_url,
      brands(id, slug, name, country),
      fragrance_accords(accord_name, percentage, color_hex),
      fragrance_notes(position, notes(id, name, family)),
      fragrance_prices(id, size_ml, price, currency, affiliate_url, retailers(id, name))
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return null

  const statsMap = await getStats([data.id])
  return mapFragrance(data as unknown as DbFrag, statsMap.get(data.id))
}

export async function getAllFragranceSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('fragrances').select('slug')
  return (data ?? []).map(f => f.slug)
}
