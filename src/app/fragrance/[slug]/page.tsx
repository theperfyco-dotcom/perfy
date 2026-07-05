import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Tree, ShoppingBag,
  Clock, Wind, Sun, Drop, Flower, CaretRight, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import VoteCard from '@/components/VoteCard'
import BuyPanel from '@/components/BuyPanel'
import FragranceActions from '@/components/FragranceActions'
import { getFragranceBySlug, getDupes } from '@/lib/db'
import styles from './page.module.css'

interface Props { params: Promise<{ slug: string }> }

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

  const longevityDist = fragrance.longevity_dist ?? {}
  const sillageDist   = fragrance.sillage_dist  ?? {}
  const dupes = await getDupes(fragrance.id, 6)

  // All notes flat — prefer flat_notes (Wikiparfum has no position data)
  const allNotes = fragrance.flat_notes?.length
    ? fragrance.flat_notes
    : [...(fragrance.top_notes ?? []), ...(fragrance.heart_notes ?? []), ...(fragrance.base_notes ?? [])]

  // JSON-LD structured data for SEO + LLM
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

      {/* JSON-LD */}
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

        {/* ── Hero — 2-col: image + info ──────────────── */}
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

            {/* Accord strip under image — scent fingerprint */}
            {fragrance.accords && fragrance.accords.length > 0 && (
              <AccordStrip accords={fragrance.accords} height={8} gap={0} />
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
                fragrance.gender === 'masculine' ? 'For Him' : fragrance.gender === 'feminine' ? 'For Her' : 'Unisex',
                fragrance.year?.toString(),
                fragrance.origin,
              ].filter(Boolean).join(' · ')}
            </p>

            {/* ── Community score — the hero ── */}
            <div className={styles.scoreBlock} itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
              {fragrance.avg_score ? (
                <>
                  <div className={styles.scoreHero}>
                    <span className={styles.scoreNum} itemProp="ratingValue">{fragrance.avg_score.toFixed(1)}</span>
                    <span className={styles.scoreMax}>/10</span>
                  </div>
                  <p className={styles.scoreContext}>
                    <meta itemProp="bestRating" content="10" />
                    <meta itemProp="worstRating" content="1" />
                    <meta itemProp="ratingCount" content={String(fragrance.rating_count ?? 0)} />
                    Based on <strong>{fragrance.rating_count?.toLocaleString()}</strong> community ratings
                  </p>
                </>
              ) : (
                <div className={styles.noScore}>
                  <p>No community ratings yet</p>
                  <p className={styles.noScoreSub}>Be the first to rate this fragrance</p>
                </div>
              )}
            </div>

            {/* ── Accords ── */}
            {fragrance.accords && fragrance.accords.length > 0 && (
              <div className={styles.accordSection}>
                <h2 className={styles.sectionLabel}>Scent profile</h2>
                <AccordStrip accords={fragrance.accords} height={40} showLabels />
                <div className={styles.accordLegend}>
                  {fragrance.accords.map(a => (
                    <div key={a.name} className={styles.accordPill}>
                      <div className={styles.accDot} style={{ background: `var(--acc-${a.name.toLowerCase()}, #C0B8B0)` }} />
                      {a.name} <span className={styles.accPct}>{a.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Metadata grid ── */}
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

            {/* ── Actions ── */}
            <FragranceActions
              fragranceId={fragrance.id}
              fragranceName={fragrance.name}
              brandName={fragrance.brand.name}
            />
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
                // Flat notes (from Wikiparfum — no tier data)
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

        {/* ── Community ratings ─────────────────────── */}
        <section className={styles.communitySection} aria-labelledby="ratings-heading">
          <h2 className={styles.sectionTitle} id="ratings-heading">Community <em>ratings</em></h2>
          <div className={styles.ratingsGrid}>
            {[
              { title: 'Longevity', icon: <Clock weight="fill" size={14} />, data: longevityDist,
                order: ['24hrs+', '12-24hrs', '8-12hrs', '4-8hrs', 'under-4hrs'],
                labels: ['24 hrs+', '12–24 hrs', '8–12 hrs', '4–8 hrs', 'Under 4 hrs'] },
              { title: 'Sillage', icon: <Wind weight="fill" size={14} />, data: sillageDist,
                order: ['enormous', 'strong', 'moderate', 'soft', 'intimate'],
                labels: ['Enormous', 'Strong', 'Moderate', 'Soft', 'Intimate'] },
              ...(Object.keys((fragrance as any).season_dist ?? {}).length > 0 ? [{
                title: 'Best season', icon: <Sun weight="fill" size={14} />, data: (fragrance as any).season_dist as Record<string, number>,
                order: ['spring', 'summer', 'autumn', 'winter', 'any'],
                labels: ['Spring', 'Summer', 'Autumn', 'Winter', 'Any'],
              }] : []),
            ].map(({ title, icon, data, order, labels }) => (
              <div key={title} className={styles.ratingCard}>
                <div className={styles.ratingCardTitle}>{icon} {title}</div>
                <div className={styles.ratingBars}>
                  {order.map((key, i) => {
                    const val = (data as Record<string, number>)[key] ?? 0
                    return (
                      <div key={key} className={styles.ratingBarRow}>
                        <span className={styles.rbLabel}>{labels[i]}</span>
                        <div className={styles.rbTrack}><div className={styles.rbFill} style={{ width: `${val}%` }} /></div>
                        <span className={styles.rbVal}>{val}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {fragrance.recommend_pct != null && (
            <div className={styles.recommendBar} role="region" aria-label="Recommendation summary">
              <div className={styles.recommendPct}>{fragrance.recommend_pct}%</div>
              <div>
                <div className={styles.recommendLabel}>would recommend {fragrance.name}</div>
                <div className={styles.recommendSub}>Based on {fragrance.rating_count?.toLocaleString()} community ratings</div>
              </div>
            </div>
          )}
        </section>

        {/* ── Where to buy — secondary ───────────────── */}
        {(fragrance.prices && fragrance.prices.length > 0) && (
          <section className={styles.buySection} id="buy" aria-labelledby="buy-heading">
            <h2 className={styles.sectionTitle} id="buy-heading">Where to <em>buy</em></h2>
            <p className={styles.buySub}>Prices tracked across authorised UK retailers</p>
            <BuyPanel
              prices={fragrance.prices}
              fragranceName={fragrance.name}
              concentration={fragrance.concentration}
            />
          </section>
        )}

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

        {/* ── Rate this ─────────────────────────────── */}
        <section className={styles.voteSection} aria-labelledby="vote-heading">
          <h2 className={styles.sectionTitle} id="vote-heading">How does it <em>wear</em> for you?</h2>
          <VoteCard fragranceId={fragrance.id} fragranceName={fragrance.name} />
        </section>

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
