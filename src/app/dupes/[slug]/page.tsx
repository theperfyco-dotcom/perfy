import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CaretRight, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import { getFragranceBySlug, getDupes } from '@/lib/db'
import styles from './page.module.css'

export const revalidate = 86400

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const f = await getFragranceBySlug(slug)
  if (!f) return {}
  return {
    title: `Fragrances That Smell Like ${f.name} by ${f.brand.name} — Dupes & Alternatives`,
    description: `Cheaper alternatives and dupes for ${f.name} by ${f.brand.name}, ranked by accord-profile similarity. Compare scent profiles and find where to buy in the UK.`,
    alternates: { canonical: `/dupes/${slug}` },
  }
}

export default async function DupePage({ params }: Props) {
  const { slug } = await params
  const fragrance = await getFragranceBySlug(slug)
  if (!fragrance) notFound()

  const dupes = await getDupes(fragrance.id, 8)
  if (!dupes.length) notFound()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Fragrances similar to ${fragrance.name} by ${fragrance.brand.name}`,
      numberOfItems: dupes.length,
      itemListElement: dupes.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${d.name} by ${d.brand.name}`,
        url: `https://perfy.io/fragrance/${d.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',        item: 'https://perfy.io' },
        { '@type': 'ListItem', position: 2, name: 'Dupe finder', item: 'https://perfy.io/dupes' },
        { '@type': 'ListItem', position: 3, name: fragrance.name },
      ],
    },
  ]

  return (
    <>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className={styles.breadcrumbBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <Link href="/dupes">Dupe finder</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <span aria-current="page">{fragrance.name}</span>
        </nav>
      </div>

      <main className={styles.main}>

        {/* Source fragrance header */}
        <div className={styles.header}>
          <div className={styles.sourceImg}>
            {fragrance.image_url && (
              <Image src={fragrance.image_url} alt={`${fragrance.name} by ${fragrance.brand.name}`} fill sizes="120px" style={{ objectFit: 'contain', padding: '10px' }} />
            )}
          </div>
          <div>
            <p className={styles.eyebrow}>Dupes &amp; alternatives</p>
            <h1 className={styles.title}>
              Smells like <em>{fragrance.name}</em>
            </h1>
            <p className={styles.sub}>
              {dupes.length} fragrances with a similar accord profile to {fragrance.name} by{' '}
              <Link href={`/brand/${fragrance.brand.slug}`}>{fragrance.brand.name}</Link> — ranked
              by scent-profile match, not sponsorship.
            </p>
            <Link href={`/fragrance/${fragrance.slug}`} className={styles.sourceLink}>
              View {fragrance.name} <ArrowRight weight="bold" size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Ranked dupes */}
        <div className={styles.list}>
          {dupes.map((d, i) => (
            <Link key={d.id} href={`/fragrance/${d.slug}`} className={styles.row}>
              <span className={styles.rank}>{i + 1}</span>
              <div className={styles.rowImg}>
                {d.image_url && (
                  <Image src={d.image_url} alt={d.name} fill sizes="80px" style={{ objectFit: 'contain', padding: '6px' }} />
                )}
              </div>
              <div className={styles.rowInfo}>
                <span className={styles.rowBrand}>{d.brand.name}</span>
                <span className={styles.rowName}>{d.name}</span>
                {d.accords && d.accords.length > 0 && (
                  <div className={styles.rowAccords}>
                    <AccordStrip accords={d.accords} height={5} gap={0} />
                  </div>
                )}
              </div>
              <div className={styles.rowRight}>
                <span className={styles.match}>{d.similarity}%</span>
                <span className={styles.matchLabel}>accord match</span>
                {d.avg_score && <span className={styles.rowScore}>{d.avg_score.toFixed(1)}/10</span>}
              </div>
            </Link>
          ))}
        </div>

        <p className={styles.method}>
          How this works: we compare the accord composition of {fragrance.name} against every
          fragrance in the database using cosine similarity. A high match means the scent profiles
          overlap strongly — performance and quality can still differ.
        </p>
      </main>
      <Footer />
    </>
  )
}
