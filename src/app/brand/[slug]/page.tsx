import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FragranceCard from '@/components/FragranceCard'
import { getBrandBySlug, getFragrancesByBrand } from '@/lib/db'
import styles from './page.module.css'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)
  if (!brand) return {}
  return {
    title: `${brand.name} Fragrances — Perfy`,
    description: brand.description
      ?? `Browse all ${brand.name} fragrances, ratings, and reviews on Perfy.`,
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = await getBrandBySlug(slug)
  if (!brand) notFound()

  const fragrances = await getFragrancesByBrand(slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: `https://perfy.co/brand/${brand.slug}`,
  }

  return (
    <>
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.breadcrumbBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <span aria-current="page">{brand.name}</span>
        </nav>
      </div>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>
              <em>{brand.name}</em>
            </h1>
            {brand.country && (
              <p className={styles.origin}>{brand.country}</p>
            )}
            <p className={styles.sub}>
              {fragrances.length.toLocaleString()} {fragrances.length === 1 ? 'fragrance' : 'fragrances'}
            </p>
          </div>
        </div>

        <div className={styles.content}>
          {fragrances.length === 0 ? (
            <div className={styles.empty}>
              <p>No fragrances found for this brand.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {fragrances.map(f => <FragranceCard key={f.id} fragrance={f} />)}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
