import type { MetadataRoute } from 'next'
import { getAllFragranceSlugs, getAllBrandSlugs } from '@/lib/db'

const BASE = 'https://perfy.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fragranceSlugs, brandSlugs] = await Promise.all([
    getAllFragranceSlugs(),
    getAllBrandSlugs(),
  ])

  const statics: MetadataRoute.Sitemap = [
    { url: BASE,              changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/discover`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about`,    changeFrequency: 'weekly', priority: 0.8 },
  ]

  const fragrances: MetadataRoute.Sitemap = fragranceSlugs.map(slug => ({
    url: `${BASE}/fragrance/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const brands: MetadataRoute.Sitemap = brandSlugs.map(slug => ({
    url: `${BASE}/brand/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...statics, ...fragrances, ...brands]
}
