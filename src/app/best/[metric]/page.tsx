import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CaretRight, Hourglass, Wind, Tag } from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getTopByRedditAttribute, type RedditAttribute } from '@/lib/db'
import styles from './page.module.css'

export const revalidate = 43200

const METRICS: Record<string, {
  attr: RedditAttribute
  Icon: Icon
  title: string
  titleEm: string
  metaTitle: string
  description: string
  scaleLabels: string[]
  valueLabel: string
}> = {
  longevity: {
    attr: 'avg_longevity',
    Icon: Hourglass,
    title: 'Longest-lasting',
    titleEm: 'fragrances',
    metaTitle: 'The Longest-Lasting Fragrances — Ranked by the Community',
    description: 'Fragrances ranked by real community longevity reports from Reddit reviews — which scents actually last all day on skin.',
    scaleLabels: ['Barely there', 'Weak', 'Moderate', 'Long-lasting', 'Eternal'],
    valueLabel: 'longevity',
  },
  sillage: {
    attr: 'avg_sillage',
    Icon: Wind,
    title: 'Beast mode',
    titleEm: 'sillage',
    metaTitle: 'Beast Mode Fragrances — Biggest Sillage, Ranked by the Community',
    description: 'The fragrances with the strongest projection and scent trail, ranked from real community sillage reports in Reddit reviews.',
    scaleLabels: ['Skin scent', 'Close', 'Moderate', 'Strong', 'Beast mode'],
    valueLabel: 'sillage',
  },
  value: {
    attr: 'avg_price_value',
    Icon: Tag,
    title: 'Best value',
    titleEm: 'fragrances',
    metaTitle: 'Best Value Fragrances — Worth the Money, Ranked by the Community',
    description: 'Fragrances the community rates as genuinely worth the money — price-to-performance ranked from real Reddit reviews.',
    scaleLabels: ['Way overpriced', 'Overpriced', 'Fair price', 'Good value', 'Great value'],
    valueLabel: 'value',
  },
}

interface Props { params: Promise<{ metric: string }> }

export function generateStaticParams() {
  return Object.keys(METRICS).map(metric => ({ metric }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metric } = await params
  const m = METRICS[metric]
  if (!m) return {}
  return {
    title: m.metaTitle,
    description: m.description,
    alternates: { canonical: `/best/${metric}` },
  }
}

export default async function BestPage({ params }: Props) {
  const { metric } = await params
  const m = METRICS[metric]
  if (!m) notFound()

  const entries = await getTopByRedditAttribute(m.attr, 15)
  if (!entries.length) notFound()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: m.metaTitle,
      description: m.description,
      numberOfItems: entries.length,
      itemListElement: entries.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${e.fragrance.name} by ${e.fragrance.brand.name}`,
        url: `https://perfy.io/fragrance/${e.fragrance.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://perfy.io' },
        { '@type': 'ListItem', position: 2, name: m.metaTitle },
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
          <span aria-current="page">Best {m.valueLabel}</span>
        </nav>
      </div>

      <main className={styles.main}>
        <div className={styles.header}>
          <m.Icon size={28} weight="duotone" className={styles.headerIcon} aria-hidden="true" />
          <h1 className={styles.title}>{m.title} <em>{m.titleEm}</em></h1>
          <p className={styles.sub}>{m.description}</p>
          <div className={styles.otherBoards}>
            {Object.entries(METRICS).filter(([k]) => k !== metric).map(([k, om]) => (
              <Link key={k} href={`/best/${k}`} className={styles.boardLink}>{om.title}</Link>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          {entries.map((e, i) => {
            const pct = (e.value / 5) * 100
            const label = m.scaleLabels[Math.min(4, Math.round(e.value) - 1)] ?? ''
            return (
              <Link key={e.fragrance.id} href={`/fragrance/${e.fragrance.slug}`} className={styles.row}>
                <span className={styles.rank}>{i + 1}</span>
                <div className={styles.rowImg}>
                  {e.fragrance.image_url && (
                    <Image src={e.fragrance.image_url} alt={e.fragrance.name} fill sizes="72px" style={{ objectFit: 'contain', padding: '6px' }} />
                  )}
                </div>
                <div className={styles.rowInfo}>
                  <span className={styles.rowBrand}>{e.fragrance.brand.name}</span>
                  <span className={styles.rowName}>{e.fragrance.name}</span>
                  <span className={styles.rowMeta}>
                    {e.mention_count} Reddit reviews{e.reddit_score ? ` · ${e.reddit_score.toFixed(1)}/10 overall` : ''}
                  </span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.scoreLabel}>{label}</span>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.scoreNum}>{e.value.toFixed(1)}/5 {m.valueLabel}</span>
                </div>
              </Link>
            )
          })}
        </div>

        <p className={styles.method}>
          Rankings are derived from AI analysis of public Reddit fragrance discussions, refined by
          anonymous community votes on Perfy. Minimum two independent reviews per fragrance.
          Performance varies by skin chemistry, climate and concentration.
        </p>
      </main>
      <Footer />
    </>
  )
}
