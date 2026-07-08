import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Tree, Drop, Flower, CaretRight, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import AccordBubbles from '@/components/AccordBubbles'
import BuyPanel from '@/components/BuyPanel'
import FragranceActions from '@/components/FragranceActions'
import PerformanceRating from '@/components/PerformanceRating'
import CollectionButton from '@/components/CollectionButton'
import ClassificationVoting from '@/components/ClassificationVoting'
import StatementsSection from '@/components/StatementsSection'
import ScentFamily from '@/components/ScentFamily'
import YouTubeReviews from '@/components/YouTubeReviews'
import {
  getFragranceBySlug, getDupes, getRedditStats, getClassificationStats, getStatements, getPerfStats,
  type RedditStats, type PerfStats,
} from '@/lib/db'
import styles from './page.module.css'

interface Props { params: Promise<{ slug: string }> }

// ── Scale definitions ────────────────────────────────────────────────────────
const SCALES = [
  { key: 'longevity',   label: 'Longevity',     options: ['Barely there', 'Weak',          'Moderate',   'Long-lasting', 'Eternal'    ] },
  { key: 'sillage',     label: 'Sillage',       options: ['Skin scent',   'Close',         'Moderate',   'Strong',       'Beast mode' ] },
  { key: 'gender',      label: 'Gender',        options: ['All female',   'Mostly female', 'Unisex',     'Mostly male',  'All male'   ] },
  { key: 'price_value', label: 'Price & value', options: ['Way overpriced','Overpriced',   'Fair price', 'Good value',   'Great value'] },
] as const

type ScaleKey = typeof SCALES[number]['key']

function scaleAvgLabel(options: readonly string[], avg: number | undefined): string | null {
  if (!avg) return null
  return options[Math.round(avg) - 1] ?? null
}

// ── Reddit → performance baseline ────────────────────────────────────────────
// Converts a Reddit average (1–5) into a ~50-vote Gaussian distribution so
// the PerformanceRating cards have a visual starting point before Perfy votes
// accumulate. Attributes with real Perfy votes are never overridden.
function redditBaseline(avg: number, scale = 50): number[] {
  if (!avg || avg < 1 || avg > 5) return [0, 0, 0, 0, 0]
  const center  = avg - 1
  const weights = [0, 1, 2, 3, 4].map(i => Math.exp(-0.6 * (i - center) ** 2))
  const wSum    = weights.reduce((a, b) => a + b, 0)
  const counts  = [0, 0, 0, 0, 0]
  let used = 0
  for (let i = 0; i < 4; i++) { counts[i] = Math.round(weights[i] / wSum * scale); used += counts[i] }
  counts[4] = Math.max(0, scale - used)
  return counts
}

function mergeWithReddit(perf: PerfStats, reddit: RedditStats | null): { stats: PerfStats; hasBaseline: boolean } {
  let hasBaseline = false
  const seed = (counts: number[], avg: number | null | undefined) => {
    if (counts.some(v => v > 0)) return counts
    if (!avg) return counts
    hasBaseline = true
    return redditBaseline(avg, 50)
  }
  // Build stats first — seed() sets hasBaseline as a side effect
  const stats: PerfStats = {
    longevity:   seed(perf.longevity,   reddit?.avg_longevity),
    sillage:     seed(perf.sillage,     reddit?.avg_sillage),
    gender:      seed(perf.gender,      reddit?.avg_gender),
    price_value: seed(perf.price_value, reddit?.avg_price_value),
  }
  return { stats, hasBaseline }
}

// ── Distribution bar display ─────────────────────────────────────────────────
function ScaleDisplay({ label, avg, dist, options }: {
  label: string
  avg: number | undefined
  dist: number[] | undefined
  options: readonly string[]
}) {
  const hasDist = dist && dist.some(v => v > 0)
  const peak = hasDist ? dist.indexOf(Math.max(...dist)) : -1

  return (
    <div className={styles.scaleDisplay}>
      <div className={styles.scaleDisplayHead}>
        <span className={styles.scaleDisplayLabel}>{label}</span>
        {avg && <span className={styles.scaleDisplayAvg}>{scaleAvgLabel(options, avg)}</span>}
      </div>
      <div className={styles.scaleBars}>
        {options.map((opt, i) => {
          const pct = hasDist ? (dist[i] ?? 0) : 0
          const isPeak = i === peak && pct > 0
          return (
            <div key={opt} className={`${styles.scaleBarRow} ${isPeak ? styles.scaleBarRowPeak : ''}`}>
              <span className={styles.scaleBarNum}>{i + 1}</span>
              <span className={styles.scaleBarLabel}>{opt}</span>
              <div className={styles.scaleBarTrack}>
                <div className={styles.scaleBarFill} style={{ width: hasDist ? `${pct}%` : '0%' }} />
              </div>
              <span className={styles.scaleBarPct}>{hasDist ? `${pct}%` : '—'}</span>
            </div>
          )
        })}
      </div>
      {!hasDist && <p className={styles.scaleNoData}>No ratings yet</p>}
    </div>
  )
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const f = await getFragranceBySlug(slug)
  if (!f) return {}

  const noteSummary = [
    ...(f.top_notes ?? []), ...(f.heart_notes ?? []), ...(f.base_notes ?? [])
  ].slice(0, 5).map(n => n.name).join(', ')

  const desc = [
    `${f.name} by ${f.brand.name}`,
    f.concentration && f.year ? `${f.concentration} (${f.year})` : null,
    f.avg_score ? `Community rating: ${f.avg_score}/10 from ${f.rating_count?.toLocaleString()} ratings` : null,
    noteSummary ? `Notes: ${noteSummary}` : null,
    f.perfumer ? `Created by perfumer ${f.perfumer}` : null,
  ].filter(Boolean).join(' · ')

  return {
    title: `${f.name} by ${f.brand.name} — Fragrance Reviews & Ratings`,
    description: desc,
    openGraph: {
      title: `${f.name} by ${f.brand.name}`,
      description: desc,
      images: f.image_url ? [{ url: f.image_url }] : [],
    },
  }
}

export default async function FragrancePage({ params }: Props) {
  const { slug } = await params
  const fragrance = await getFragranceBySlug(slug)
  if (!fragrance) notFound()

  const [dupes, redditStats, classStats, statements, perfStats] = await Promise.all([
    getDupes(fragrance.id, 6),
    getRedditStats(fragrance.id),
    getClassificationStats(fragrance.id),
    getStatements(fragrance.id, 8),
    getPerfStats(fragrance.id),
  ])

  const { stats: mergedPerfStats, hasBaseline } = mergeWithReddit(perfStats, redditStats)

  const allNotes = fragrance.flat_notes?.length
    ? fragrance.flat_notes
    : [...(fragrance.top_notes ?? []), ...(fragrance.heart_notes ?? []), ...(fragrance.base_notes ?? [])]

  const sortedAccords = [...(fragrance.accords ?? [])].sort((a, b) => b.percentage - a.percentage)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fragrance.name,
    brand: { '@type': 'Brand', name: fragrance.brand.name },
    description: fragrance.description ?? undefined,
    image: fragrance.image_url ?? undefined,
    ...(fragrance.avg_score && fragrance.rating_count ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: fragrance.avg_score,
        bestRating: 10,
        worstRating: 1,
        ratingCount: fragrance.rating_count,
      },
    } : {}),
  }

  return (
    <>
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className={styles.breadcrumbBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <Link href={`/brand/${fragrance.brand.slug}`}>{fragrance.brand.name}</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <span aria-current="page">{fragrance.name}</span>
        </nav>
      </div>

      <main itemScope itemType="https://schema.org/Product">

        {/* ── Hero ─────────────────────────────────── */}
        <section className={styles.hero} aria-labelledby="frag-name">

          {/* Image column */}
          <div className={styles.imgWrap}>
            <div className={styles.img} aria-label={`${fragrance.name} bottle`}>
              {fragrance.image_url ? (
                <Image
                  src={fragrance.image_url}
                  alt={`${fragrance.name} by ${fragrance.brand.name}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 380px"
                  style={{ objectFit: 'contain', padding: '16px' }}
                  priority
                  itemProp="image"
                />
              ) : (
                <Tree weight="fill" size={100} className={styles.imgIcon} aria-hidden="true" />
              )}
            </div>
            {sortedAccords.length > 0 && (
              <AccordStrip accords={sortedAccords} height={8} gap={0} />
            )}
          </div>

          {/* Info column */}
          <div className={styles.info}>
            <Link href={`/brand/${fragrance.brand.slug}`} className={styles.brandLink} itemProp="brand">
              {fragrance.brand.name}
            </Link>
            <h1 className={styles.name} id="frag-name" itemProp="name">{fragrance.name}</h1>
            {(() => {
              const parts = [
                fragrance.concentration,
                fragrance.gender === 'masculine' ? 'For Him' : fragrance.gender === 'feminine' ? 'For Her' : fragrance.gender === 'unisex' ? 'Unisex' : null,
                fragrance.year?.toString(),
                fragrance.origin,
              ].filter(Boolean) as string[]
              return parts.length > 0 ? <p className={styles.variant}>{parts.join(' · ')}</p> : null
            })()}

            {/* ── Community score — key signal, high up.
                 Perfy ratings first; Reddit sentiment as launch-phase fallback ── */}
            {fragrance.avg_score ? (
              <div className={styles.scoreBlock} itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <div className={styles.scorePair}>
                  <span className={styles.scoreNum} itemProp="ratingValue">{fragrance.avg_score.toFixed(1)}</span>
                  <span className={styles.scoreMax}>/10</span>
                </div>
                <span className={styles.scoreSublabel}>{fragrance.rating_count?.toLocaleString()} community ratings</span>
                <meta itemProp="bestRating"  content="10" />
                <meta itemProp="worstRating" content="1" />
                <meta itemProp="ratingCount" content={String(fragrance.rating_count ?? 0)} />
              </div>
            ) : redditStats?.avg_score ? (
              <div className={styles.scoreBlock}>
                <div className={styles.scorePair}>
                  <span className={styles.scoreNum}>{redditStats.avg_score.toFixed(1)}</span>
                  <span className={styles.scoreMax}>/10</span>
                </div>
                <span className={styles.scoreSublabel}>
                  {`From ${redditStats.mention_count} Reddit reviews on r/fragrance & more`}
                </span>
              </div>
            ) : null}

            {/* ── Scent profile — family, accords, and notes together.
                 The single most important block: what does it smell like? ── */}
            {(fragrance.fw_classification || sortedAccords.length > 0 || allNotes.length > 0) && (
              <div className={styles.scentIdentity}>
                <span className={styles.sectionLabel}>Scent profile</span>
                {fragrance.fw_classification && (
                  <ScentFamily classification={fragrance.fw_classification} />
                )}
                {sortedAccords.length > 0 && (
                  <div className={styles.accordBubbleSection}>
                    <AccordBubbles accords={sortedAccords} />
                  </div>
                )}

                {/* Notes — tiered pyramid when known, flat list otherwise */}
                {fragrance.top_notes?.length ? (
                  <div className={styles.noteTiers}>
                    {[
                      { tier: 'Top',   icon: <Drop weight="fill" size={11} />,   notes: fragrance.top_notes },
                      { tier: 'Heart', icon: <Flower weight="fill" size={11} />, notes: fragrance.heart_notes },
                      { tier: 'Base',  icon: <Tree weight="fill" size={11} />,   notes: fragrance.base_notes },
                    ].filter(t => t.notes?.length).map(({ tier, icon, notes }) => (
                      <div key={tier} className={styles.noteTierRow}>
                        <span className={styles.noteTierLabel}>{icon} {tier}</span>
                        <div className={styles.notePills}>
                          {notes?.map(n => (
                            <Link key={n.id} href={`/note/${n.name.toLowerCase()}`} className={styles.notePill}>
                              {n.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : allNotes.length > 0 ? (
                  <div className={styles.noteTiers}>
                    <div className={styles.noteTierRow}>
                      <span className={styles.noteTierLabel}><Tree weight="fill" size={11} /> Notes</span>
                      <div className={styles.notePills}>
                        {allNotes.map(n => (
                          <Link key={n.id} href={`/note/${n.name.toLowerCase()}`} className={styles.notePill}>
                            {n.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Collection + actions ── */}
            <CollectionButton fragranceId={fragrance.id} />
            <FragranceActions
              fragranceId={fragrance.id}
              fragranceName={fragrance.name}
              brandName={fragrance.brand.name}
            />

            {/* ── Details (perfumer / origin / concepts) — lowest priority ── */}
            {(fragrance.perfumer || fragrance.origin || (fragrance.concepts && fragrance.concepts.length > 0)) && (
              <div className={styles.metaGrid}>
                {fragrance.perfumer && (
                  <div className={styles.metaItem}>
                    <dt className={styles.metaLabel}>Perfumer</dt>
                    <dd className={styles.metaValue}>{fragrance.perfumer}</dd>
                  </div>
                )}
                {fragrance.origin && (
                  <div className={styles.metaItem}>
                    <dt className={styles.metaLabel}>Origin</dt>
                    <dd className={styles.metaValue}>{fragrance.origin}</dd>
                  </div>
                )}
                {fragrance.concepts && fragrance.concepts.length > 0 && (
                  <div className={`${styles.metaItem} ${styles.metaFull}`}>
                    <dt className={styles.metaLabel}>Best for</dt>
                    <dd className={styles.conceptPills}>
                      {fragrance.concepts.slice(0, 8).map(c => (
                        <span key={c} className={styles.conceptPill}>{c}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </div>
            )}
          </div>

        </section>

        {/* ── Community ratings ── */}
        <section className={styles.perfSection} aria-labelledby="perf-heading">
          <h2 className={styles.sectionTitle} id="perf-heading">Community <em>ratings</em></h2>
          <p className={styles.voteText}>
            Rate each attribute — no account needed.
            {hasBaseline && <span className={styles.baselineNote}> Seeded from community data.</span>}
          </p>
          <PerformanceRating fragranceId={fragrance.id} initialStats={mergedPerfStats} />
        </section>

        {/* ── Season / occasion / style classification ── */}
        <section className={styles.classSection} aria-labelledby="class-heading">
          <h2 className={styles.sectionTitle} id="class-heading">Community <em>classification</em></h2>
          <p className={styles.voteText}>When do people wear it? How do they describe it?</p>
          <ClassificationVoting fragranceId={fragrance.id} initialStats={classStats} />
        </section>

        {/* ── Community statements ─────────────────── */}
        <section className={styles.statementsSection} aria-labelledby="statements-heading">
          <StatementsSection fragranceId={fragrance.id} initialStatements={statements} />
        </section>

        {/* ── YouTube reviews — section wrapper is inside YouTubeReviews (returns null when no videos) */}
        <YouTubeReviews
          fragranceId={fragrance.id}
          fragranceName={fragrance.name}
          brandName={fragrance.brand.name}
        />

        {/* ── Where to buy ─────────────────────────────── */}
        <section className={styles.buySection} id="buy" aria-labelledby="buy-heading">
          <h2 className={styles.sectionTitle} id="buy-heading">Where to <em>buy</em></h2>
          <p className={styles.buySub}>
            {(fragrance.prices ?? []).length > 0
              ? 'Prices tracked across authorised UK retailers'
              : 'Search authorised retailers and marketplaces'}
          </p>
          <BuyPanel
            prices={fragrance.prices ?? []}
            fragranceName={fragrance.name}
            brandName={fragrance.brand.name}
            concentration={fragrance.concentration}
          />
        </section>

        {/* ── Similar fragrances ────────────────────── */}
        {dupes.length > 0 && (
          <section className={styles.dupesSection} aria-labelledby="dupes-heading">
            <div className={styles.dupeSectionHead}>
              <h2 className={styles.sectionTitle} id="dupes-heading">Similar <em>fragrances</em></h2>
              <Link href={`/dupes?search=${encodeURIComponent(fragrance.name)}`} className="section-link">
                Explore dupes <ArrowRight weight="bold" size={12} />
              </Link>
            </div>
            <p className={styles.dupesSub}>Sorted by scent-profile similarity</p>
            <div className={styles.dupeGrid}>
              {dupes.map(d => (
                <Link key={d.id} href={`/fragrance/${d.slug}`} className={styles.dupeCard}>
                  <div className={styles.dupeMatch}>{d.similarity}% match</div>
                  {d.image_url && (
                    <div className={styles.dupeImgWrap}>
                      <Image src={d.image_url} alt={d.name} fill sizes="140px" style={{ objectFit: 'contain', padding: '8px' }} />
                    </div>
                  )}
                  {d.accords && d.accords.length > 0 && <AccordStrip accords={d.accords} height={4} gap={0} />}
                  <div className={styles.dupeCardBody}>
                    <div className={styles.dupeCardBrand}>{d.brand.name}</div>
                    <div className={styles.dupeCardName}>{d.name}</div>
                    {d.avg_score && <div className={styles.dupeCardScore}>{d.avg_score.toFixed(1)}<span>/10</span></div>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-nav-inner">
          {[
            { href: '/',         label: 'Home' },
            { href: '/discover', label: 'Discover' },
            { href: '/dupes',    label: 'Dupes' },
            { href: '/lists',    label: 'Lists' },
            { href: '/profile',  label: 'Profile' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="mob-nav-item">{label}</Link>
          ))}
        </div>
      </nav>
    </>
  )
}
