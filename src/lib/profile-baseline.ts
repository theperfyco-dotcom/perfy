// Baseline estimates derived from a fragrance's own metadata — concentration,
// gender, and accord profile. Used to give rating and classification sections
// a meaningful starting point on pages with no votes and no Reddit data.
// Always labelled as estimates in the UI; real votes take precedence.

import type { Fragrance } from '@/lib/types'

// ── Performance attribute priors (1–5 scale) ─────────────────────────────────

const CONCENTRATION_PRIORS: Array<[RegExp, { longevity: number; sillage: number }]> = [
  [/extrait|parfum$|pure perfume/i, { longevity: 4.2, sillage: 3.7 }],
  [/eau de parfum|edp/i,            { longevity: 3.6, sillage: 3.2 }],
  [/eau de toilette|edt/i,          { longevity: 2.9, sillage: 2.8 }],
  [/cologne|eau de cologne|edc|eau fraiche/i, { longevity: 2.3, sillage: 2.3 }],
]

const HEAVY_ACCORDS = new Set(['Amber', 'Oud', 'Smoky', 'Leather', 'Musky', 'Spicy'])
const LIGHT_ACCORDS = new Set(['Citrus', 'Fresh', 'Green', 'Aromatic'])

export interface PerfBaseline {
  longevity:   number | null
  sillage:     number | null
  gender:      number | null
  price_value: null // never estimated — value is a judgement, not a property
}

export function profilePerfBaseline(fragrance: Fragrance): PerfBaseline {
  // Longevity / sillage from concentration, nudged by accord weight
  let longevity: number | null = null
  let sillage:   number | null = null
  const conc = fragrance.concentration ?? ''
  for (const [re, prior] of CONCENTRATION_PRIORS) {
    if (re.test(conc)) { longevity = prior.longevity; sillage = prior.sillage; break }
  }
  // No concentration? A generic mid prior still beats an empty section,
  // but only when we have accords to nudge it with.
  const accords = (fragrance.accords ?? []).slice(0, 3).map(a => a.name)
  if (longevity == null && accords.length > 0) { longevity = 3.2; sillage = 3.0 }

  if (longevity != null && sillage != null && accords.length > 0) {
    const heavy = accords.filter(a => HEAVY_ACCORDS.has(a)).length
    const light = accords.filter(a => LIGHT_ACCORDS.has(a)).length
    const nudge = (heavy - light) * 0.25
    longevity = Math.min(5, Math.max(1, longevity + nudge))
    sillage   = Math.min(5, Math.max(1, sillage + nudge))
  }

  // Gender directly from the catalogue field
  const gender = fragrance.gender === 'masculine' ? 3.9
    : fragrance.gender === 'feminine' ? 2.1
    : fragrance.gender === 'unisex' ? 3.0
    : null

  return { longevity, sillage, gender, price_value: null }
}

// ── Classification priors (season / occasion / style percentages) ────────────

interface AccordClassWeights {
  seasons:   Partial<Record<'spring' | 'summer' | 'autumn' | 'winter', number>>
  occasions: Partial<Record<'daily' | 'office' | 'evening' | 'sport' | 'formal' | 'date', number>>
  styles:    Partial<Record<'fresh' | 'elegant' | 'casual' | 'sporty' | 'romantic' | 'bold' | 'dark' | 'cozy', number>>
}

const ACCORD_CLASS: Record<string, AccordClassWeights> = {
  Citrus:   { seasons: { spring: 3, summer: 4 }, occasions: { daily: 3, office: 2, sport: 2 }, styles: { fresh: 4, casual: 2, sporty: 1 } },
  Fresh:    { seasons: { spring: 3, summer: 4 }, occasions: { daily: 3, office: 2, sport: 3 }, styles: { fresh: 4, sporty: 2, casual: 2 } },
  Green:    { seasons: { spring: 4, summer: 2 }, occasions: { daily: 3, office: 2 },           styles: { fresh: 3, casual: 2 } },
  Aromatic: { seasons: { spring: 2, summer: 2, autumn: 1 }, occasions: { daily: 3, office: 2, sport: 1 }, styles: { fresh: 2, casual: 2, elegant: 1 } },
  Fruity:   { seasons: { spring: 3, summer: 3 }, occasions: { daily: 2, date: 2 },             styles: { casual: 2, romantic: 2, fresh: 1 } },
  Floral:   { seasons: { spring: 4, summer: 2 }, occasions: { daily: 2, date: 2, formal: 1 },  styles: { romantic: 3, elegant: 3 } },
  Powdery:  { seasons: { spring: 2, autumn: 2 }, occasions: { office: 2, formal: 2 },          styles: { elegant: 3, cozy: 2 } },
  Woody:    { seasons: { autumn: 3, winter: 2 }, occasions: { office: 2, daily: 2, formal: 2 }, styles: { elegant: 2, casual: 1, cozy: 1 } },
  Musky:    { seasons: { autumn: 2, winter: 2 }, occasions: { evening: 2, date: 2 },           styles: { elegant: 2, cozy: 2 } },
  Amber:    { seasons: { autumn: 3, winter: 4 }, occasions: { evening: 3, date: 2, formal: 1 }, styles: { cozy: 3, bold: 2, elegant: 1 } },
  Spicy:    { seasons: { autumn: 3, winter: 3 }, occasions: { evening: 3, date: 2 },           styles: { bold: 3, dark: 1, cozy: 1 } },
  Oud:      { seasons: { autumn: 2, winter: 4 }, occasions: { evening: 3, formal: 3 },         styles: { bold: 3, dark: 3 } },
  Leather:  { seasons: { autumn: 3, winter: 3 }, occasions: { evening: 3, formal: 2 },         styles: { bold: 3, dark: 2 } },
  Smoky:    { seasons: { autumn: 2, winter: 3 }, occasions: { evening: 3 },                    styles: { dark: 3, bold: 2 } },
}

export interface ClassificationBaseline {
  season:   Record<'spring' | 'summer' | 'autumn' | 'winter', number>
  occasion: Record<'daily' | 'office' | 'evening' | 'sport' | 'formal' | 'date', number>
  style:    Record<'fresh' | 'elegant' | 'casual' | 'sporty' | 'romantic' | 'bold' | 'dark' | 'cozy', number>
}

export function profileClassificationBaseline(fragrance: Fragrance): ClassificationBaseline | null {
  const accords = (fragrance.accords ?? [])
  if (!accords.length) return null

  const season:   Record<string, number> = { spring: 0, summer: 0, autumn: 0, winter: 0 }
  const occasion: Record<string, number> = { daily: 0, office: 0, evening: 0, sport: 0, formal: 0, date: 0 }
  const style:    Record<string, number> = { fresh: 0, elegant: 0, casual: 0, sporty: 0, romantic: 0, bold: 0, dark: 0, cozy: 0 }

  let matched = 0
  for (const a of accords) {
    const w = ACCORD_CLASS[a.name]
    if (!w) continue
    matched++
    const weight = a.percentage / 100
    for (const [k, v] of Object.entries(w.seasons))   season[k]   += v * weight
    for (const [k, v] of Object.entries(w.occasions)) occasion[k] += v * weight
    for (const [k, v] of Object.entries(w.styles))    style[k]    += v * weight
  }
  if (matched === 0) return null

  const toPct = (rec: Record<string, number>) => {
    const total = Object.values(rec).reduce((a, b) => a + b, 0)
    if (total === 0) return rec
    for (const k of Object.keys(rec)) rec[k] = Math.round((rec[k] / total) * 100)
    return rec
  }

  return {
    season:   toPct(season)   as ClassificationBaseline['season'],
    occasion: toPct(occasion) as ClassificationBaseline['occasion'],
    style:    toPct(style)    as ClassificationBaseline['style'],
  }
}
