import type { MetadataRoute } from 'next'
import { getAllFragranceSlugs, getAllBrandSlugs, getAllNotes, getSlugsWithAccords } from '@/lib/db'

// Regenerate at most once a day; allow time for the paginated catalogue queries
export const revalidate = 86400
export const maxDuration = 60

const BASE = 'https://perfy.io'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fragranceSlugs, brandSlugs, notes, dupeSlugs] = await Promise.all([
    getAllFragranceSlugs(),
    getAllBrandSlugs(),
    getAllNotes(),
    getSlugsWithAccords(),
  ])

  const statics: MetadataRoute.Sitemap = [
    { url: BASE,                           changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/discover`,             changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/trending`,             changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/dupes`,                changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/notes`,                changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/brands`,               changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/community`,            changeFrequency: 'daily',   priority: 0.6 },
    { url: `${BASE}/awards`,               changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`,                changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/affiliate-disclosure`, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/privacy`,              changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE}/terms`,                changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const fragrances: MetadataRoute.Sitemap = fragranceSlugs.map(slug => ({
    url: `${BASE}/fragrance/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const brands: MetadataRoute.Sitemap = brandSlugs.map(slug => ({
    url: `${BASE}/brand/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const notePages: MetadataRoute.Sitemap = notes.map(n => ({
    url: `${BASE}/note/${encodeURIComponent(n.name.toLowerCase())}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const dupePages: MetadataRoute.Sitemap = dupeSlugs.map(slug => ({
    url: `${BASE}/dupes/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const bestPages: MetadataRoute.Sitemap = ['longevity', 'sillage', 'value', 'summer', 'winter'].map(metric => ({
    url: `${BASE}/best/${metric}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...statics, ...fragrances, ...brands, ...notePages, ...dupePages, ...bestPages]
}
