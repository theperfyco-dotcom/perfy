import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/profile', '/lists'] },
    sitemap: 'https://perfy.io/sitemap.xml',
  }
}
