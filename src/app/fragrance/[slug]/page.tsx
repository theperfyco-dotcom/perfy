import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Tree, Drop, Flower, CaretRight, ArrowRight, RedditLogo, TrendUp,
} from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import AccordBubbles from '@/components/AccordBubbles'
import BuyPanel from '@/components/BuyPanel'
import FragranceActions from '@/components/FragranceActions'
import VoteCard from '@/components/VoteCard'
import CollectionButton from '@/components/CollectionButton'
import ClassificationVoting from '@/components/ClassificationVoting'
import StatementsSection from '@/components/StatementsSection'
import {
  getFragranceBySlug, getDupes, getRedditStats, getClassificationStats, getStatements,
  type RedditStats,
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

// ── Compact Reddit card ───────────────────────────────────────────────────────
function RedditCard({ stats }: { stats: RedditStats }) {
  const sentPct = stats.avg_sentiment !== null ? Math.round((stats.avg_sentiment + 1) * 50) : null
  const rising  = stats.mentions_this_month > stats.mentions_last_month

  return (
    <div className={styles.redditCard}>
      <div className={styles.redditCardHead}>
        <RedditLogo size={16} weight="fill" className={styles.redditIcon} aria-hidden="true" />
        <span className={styles.redditCardTitle}>Reddit signal</span>
        {rising && (
          <span className={styles.redditRising}>
            <TrendUp size={10} weight="bold" /> trending
          </span>
        )}
      </div>

      <div className={styles.redditCardBody}>
        {stats.avg_score !== null && (
          <div className={styles.redditScoreRow}>
            <span className={styles.redditScoreNum}>{stats.avg_score.toFixed(1)}</span>
            <span className={styles.redditScoreMax}>/10</span>
            <span className={styles.redditScoreLabel}>Reddit score</span>
          </div>
        )}
        {sentPct !== null && (
          <div className={styles.redditSent}>
            <div className={styles.redditSentBar}>
              <div className={styles.redditSentFill} style={{ width: `${sentPct}%` }} />
            </div>
            <span className={styles.redditSentPct}>{sentPct}% positive</span>
          </div>
        )}
        <span className={styles.redditMentions}>{stats.mention_count} posts analysed</span>
      </div>

      <p className={styles.redditCardFooter}>r/fragrance · r/fragranceclones</p>
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

  const [dupes, redditStats, classStats, statements] = await Promise.all([
    getDupes(fragrance.id, 6),
    getRedditStats(fragrance.id),
    getClassificationStats(fragrance.id),
    getStatements(fragrance.id, 8),
  ])

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

  // Pre-compute metric rows for hero signal block
  const heroMetrics = SCALES.map(({ key, label, options }) => {
    const perfyAvg  = fragrance[`avg_${key}` as `avg_${ScaleKey}`] as number | undefined
    const redditAvg = redditStats?.[`avg_${key}` as keyof RedditStats] as number | null | undefined
    if (!perfyAvg && !redditAvg) return null
    const consensusAvg   = perfyAvg ?? (redditAvg ?? 0)
    const consensusLabel = scaleAvgLabel(options, consensusAvg)
    return { key, label, perfyAvg: perfyAvg ?? null, redditAvg: redditAvg ?? null, consensusLabel }
  }).filter(Boolean) as { key: string; label: string; perfyAvg: number | null; redditAvg: number | null; consensusLabel: string | null }[]

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
            <p className={styles.variant}>
              {[
                fragrance.concentration,
                fragrance.gender === 'masculine' ? 'For Him' : fragrance.gender === 'feminine' ? 'For Her' : fragrance.gender === 'unisex' ? 'Unisex' : null,
                fragrance.year?.toString(),
                fragrance.origin,
              ].filter(Boolean).join(' · ')}
            </p>

            {/* ── Accord Bubbles — scent first ── */}
            {sortedAccords.length > 0 && (
              <div className={styles.accordBubbleSection}>
                <span className={styles.sectionLabel}>Scent profile</span>
                <AccordBubbles accords={sortedAccords} />
              </div>
            )}

            {/* ── Signal block: dual scores + dual-source metrics ── */}
            <div className={styles.signalBlock} itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
              {/* Scores row */}
              <div className={styles.scoresRow}>
                {/* Perfy score */}
                <div className={styles.scoreColPerfy}>
                  <div className={styles.scorePair}>
                    {fragrance.avg_score
                      ? <><span className={styles.scoreNum} itemProp="ratingValue">{fragrance.avg_score.toFixed(1)}</span><span className={styles.scoreMax}>/10</span></>
                      : <span className={styles.scoreDash}>—</span>
                    }
                  </div>
                  <span className={styles.scoreSublabel}>
                    {fragrance.rating_count
                      ? `${fragrance.rating_count.toLocaleString()} ratings`
                      : 'No ratings yet'
                    }
                  </span>
                </div>

                {redditStats && (
                  <>
                    <div className={styles.scoreDivider} aria-hidden="true" />
                    <div className={styles.scoreColReddit}>
                      <div className={styles.redditScoreHead}>
                        <RedditLogo size={12} weight="fill" className={styles.redditIconSmall} aria-hidden="true" />
                        <span className={styles.redditSourceLabel}>Reddit</span>
                        {redditStats.mentions_this_month > redditStats.mentions_last_month && (
                          <span className={styles.redditRisingMini}>
                            <TrendUp size={9} weight="bold" />
                          </span>
                        )}
                      </div>
                      <div className={styles.scorePair}>
                        {redditStats.avg_score !== null
                          ? <><span className={styles.scoreNumReddit}>{redditStats.avg_score.toFixed(1)}</span><span className={styles.scoreMaxSm}>/10</span></>
                          : <span className={styles.scoreDash}>—</span>
                        }
                      </div>
                      <span className={styles.scoreSublabel}>{redditStats.mention_count.toLocaleString()} posts</span>
                    </div>
                  </>
                )}

                {fragrance.avg_score && (
                  <>
                    <meta itemProp="bestRating" content="10" />
                    <meta itemProp="worstRating" content="1" />
                    <meta itemProp="ratingCount" content={String(fragrance.rating_count ?? 0)} />
                  </>
                )}
              </div>

              {/* Dual-source metric bars */}
              {heroMetrics.length > 0 && (
                <div className={styles.metricsList}>
                  {heroMetrics.map(m => (
                    <div key={m.key} className={styles.metricRow}>
                      <span className={styles.metricLabel}>{m.label}</span>
                      <div className={styles.metricBars}>
                        <div className={`${styles.metricTrack} ${!m.perfyAvg ? styles.metricTrackDim : ''}`} title={m.perfyAvg ? `Perfy community` : 'No Perfy ratings yet'}>
                          <div className={styles.metricFillPerfy} style={{ width: m.perfyAvg ? `${(m.perfyAvg / 5) * 100}%` : '0%' }} />
                        </div>
                        <div className={`${styles.metricTrack} ${!m.redditAvg ? styles.metricTrackDim : ''}`} title={m.redditAvg ? 'Reddit community' : 'No Reddit data'}>
                          <div className={styles.metricFillReddit} style={{ width: m.redditAvg ? `${(m.redditAvg / 5) * 100}%` : '0%' }} />
                        </div>
                      </div>
                      <span className={styles.metricConsensus}>{m.consensusLabel}</span>
                    </div>
                  ))}
                  <div className={styles.metricLegend}>
                    <span className={styles.legDot} />Perfy
                    {redditStats && <><span className={`${styles.legDot} ${styles.legDotReddit}`} />Reddit</>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Metadata ── */}
            {(fragrance.fw_classification || fragrance.perfumer || fragrance.origin || (fragrance.concepts && fragrance.concepts.length > 0)) && (
              <div className={styles.metaGrid}>
                {fragrance.fw_classification && (
                  <div className={styles.metaItem}>
                    <dt className={styles.metaLabel}>Classification</dt>
                    <dd className={styles.metaValue}>{fragrance.fw_classification}</dd>
                  </div>
                )}
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

            {/* ── Collection buttons ── */}
            <CollectionButton fragranceId={fragrance.id} />

            {/* ── Share / wishlist actions ── */}
            <FragranceActions
              fragranceId={fragrance.id}
              fragranceName={fragrance.name}
              brandName={fragrance.brand.name}
            />
          </div>

        </section>

        {/* ── Community Signal — unified section ── */}
        <section className={styles.communitySection} aria-labelledby="community-heading">
          <h2 className={styles.sectionTitle} id="community-heading">Community <em>signal</em></h2>

          <div className={styles.communityGrid}>

            {/* Panel 1: Ratings */}
            <div className={styles.communityPanel}>
              <div className={styles.panelLabel}>Ratings</div>

              {fragrance.avg_score ? (
                <>
                  <div className={styles.communityScore}>
                    <span className={styles.comScoreNum}>{fragrance.avg_score.toFixed(1)}</span>
                    <span className={styles.comScoreMax}>/10</span>
                    <span className={styles.comScoreCount}>{fragrance.rating_count?.toLocaleString()} ratings</span>
                  </div>
                  <div className={styles.communityScales}>
                    {SCALES.map(({ key, label, options }) => (
                      <ScaleDisplay
                        key={key}
                        label={label}
                        avg={fragrance[`avg_${key}` as `avg_${ScaleKey}`] as number | undefined}
                        dist={fragrance.scale_dists?.[key as keyof typeof fragrance.scale_dists]}
                        options={options}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.panelEmpty}>
                  <p>No ratings yet</p>
                  <p>Rate this fragrance below to be the first.</p>
                </div>
              )}
            </div>

            {/* Panel 2: Classification voting */}
            <div className={styles.communityPanel}>
              <div className={styles.panelLabel}>Classification</div>
              <ClassificationVoting fragranceId={fragrance.id} initialStats={classStats} />
            </div>

            {/* Panel 3: Reddit */}
            {redditStats && (
              <div className={styles.communityPanel}>
                <div className={styles.panelLabel}>Reddit</div>
                <RedditCard stats={redditStats} />
              </div>
            )}

          </div>
        </section>

        {/* ── Notes pyramid ─────────────────────────── */}
        {(fragrance.top_notes?.length || fragrance.heart_notes?.length || fragrance.base_notes?.length || allNotes.length > 0) && (
          <section className={styles.notesSection} aria-labelledby="notes-heading">
            <h2 className={styles.sectionTitle} id="notes-heading">Fragrance <em>notes</em></h2>
            <div className={styles.pyramid}>
              {fragrance.top_notes?.length ? (
                [
                  { tier: 'Top notes',   icon: <Drop weight="fill" size={12} />,   notes: fragrance.top_notes },
                  { tier: 'Heart notes', icon: <Flower weight="fill" size={12} />, notes: fragrance.heart_notes },
                  { tier: 'Base notes',  icon: <Tree weight="fill" size={12} />,   notes: fragrance.base_notes },
                ].filter(t => t.notes?.length).map(({ tier, icon, notes }) => (
                  <div key={tier} className={styles.pyramidTier}>
                    <div className={styles.pyramidTierLabel}>{icon} {tier}</div>
                    <div className={styles.pyramidNotes}>
                      {notes?.map(n => (
                        <Link key={n.id} href={`/note/${n.name.toLowerCase()}`} className={styles.pyramidNote}>
                          {n.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.pyramidTier}>
                  <div className={styles.pyramidTierLabel}><Tree weight="fill" size={12} /> Ingredients</div>
                  <div className={styles.pyramidNotes}>
                    {allNotes.map(n => (
                      <Link key={n.id} href={`/note/${n.name.toLowerCase()}`} className={styles.pyramidNote}>
                        {n.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Rate this ─────────────────────────────── */}
        <section className={styles.voteSection} aria-labelledby="vote-heading">
          <h2 className={styles.sectionTitle} id="vote-heading">Rate <em>{fragrance.name}</em></h2>
          <p className={styles.voteText}>Score it, vote on longevity, sillage, gender and value — your ratings shape the community profile above.</p>
          <VoteCard fragranceId={fragrance.id} fragranceName={fragrance.name} scaleDists={fragrance.scale_dists} />
        </section>

        {/* ── Community statements ─────────────────── */}
        <section className={styles.statementsSection} aria-labelledby="statements-heading">
          <StatementsSection fragranceId={fragrance.id} initialStatements={statements} />
        </section>

        {/* ── Where to buy ─────────────────────────────── */}
        <section className={styles.buySection} id="buy" aria-labelledby="buy-heading">
          <h2 className={styles.sectionTitle} id="buy-heading">Where to <em>buy</em></h2>
          <p className={styles.buySub}>Prices tracked across authorised UK retailers</p>
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
