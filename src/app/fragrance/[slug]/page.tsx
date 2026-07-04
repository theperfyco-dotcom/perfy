import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Tree, Star, Heart, ListPlus, Export, ShoppingBag,
  Clock, Wind, Sun, Drop,
  Flower, Storefront, Bell, CaretRight, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import VoteCard from '@/components/VoteCard'
import { getFragranceBySlug } from '@/lib/db'
import styles from './page.module.css'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const f = await getFragranceBySlug(slug)
  if (!f) return {}
  return {
    title: `${f.name} by ${f.brand.name}`,
    description: `Community ratings for ${f.name}${f.avg_score ? `: ${f.avg_score}/10` : ''} — longevity, sillage, scent profile and best price.`,
  }
}

export default async function FragrancePage({ params }: Props) {
  const { slug } = await params
  const fragrance = await getFragranceBySlug(slug)
  if (!fragrance) notFound()

  const dupes: Array<{ id: string; match_pct: number; dupe_name: string; dupe_brand: string; price: number; saves: number; vote_count: number }> = []
  const lowestPrice = fragrance.prices?.sort((a, b) => a.price - b.price)[0]

  const longevityDist = fragrance.longevity_dist ?? {}
  const sillage_dist  = fragrance.sillage_dist  ?? {}

  return (
    <>
      <Nav />

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

      <main>

        {/* ── Hero ──────────────────────────────────── */}
        <section className={styles.hero} aria-labelledby="frag-name">

          {/* Image */}
          <div className={styles.imgWrap}>
            <div className={styles.img} role="img" aria-label={`${fragrance.name} bottle`}>
              <Tree weight="fill" size={100} className={styles.imgIcon} aria-hidden="true" />
            </div>
          </div>

          {/* Info */}
          <div className={styles.info}>
            <Link href={`/brand/${fragrance.brand.slug}`} className={styles.brandLink}>
              {fragrance.brand.name}
            </Link>
            <h1 className={styles.name} id="frag-name">{fragrance.name}</h1>
            <p className={styles.variant}>
              {fragrance.concentration} · {fragrance.gender === 'masculine' ? 'For Him' : fragrance.gender === 'feminine' ? 'For Her' : 'Unisex'} · {fragrance.year}
            </p>

            {/* Score */}
            <div className={styles.scoreRow}>
              <div>
                <span className={styles.scoreNum}>{fragrance.avg_score?.toFixed(1)}</span>
                <span className={styles.scoreDenom}>/10</span>
                <div className={styles.scoreCount}>{fragrance.rating_count?.toLocaleString()} community ratings</div>
              </div>
              <div className={styles.scoreDivider} aria-hidden="true" />
              <div className={styles.statBadges}>
                {[
                  { label: 'Longevity', val: 82 },
                  { label: 'Sillage',   val: 74 },
                  { label: 'Value',     val: 61 },
                ].map(({ label, val }) => (
                  <div key={label} className={styles.statBadge}>
                    <span className={styles.statLabel}>{label}</span>
                    <div className={styles.statTrack}><div className={styles.statFill} style={{ width: `${val}%` }} /></div>
                    <span className={styles.statVal}>{(val / 10).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className={styles.genderRow}>
              <span className={`${styles.genderPill} ${styles.genderActive}`}>Men's {fragrance.gender_dist?.masculine}%</span>
              <div className={styles.genderBar} aria-hidden="true">
                <div style={{ height: '100%', width: `${fragrance.gender_dist?.masculine ?? 70}%`, background: 'var(--acc-fresh)', borderRadius: 2 }} />
              </div>
              <span className={styles.genderPill}>Women's {fragrance.gender_dist?.feminine}%</span>
            </div>

            {/* Accords */}
            {fragrance.accords && fragrance.accords.length > 0 && (
              <>
                <div className={styles.sectionLabel}>Scent profile</div>
                <AccordStrip accords={fragrance.accords} height={48} showLabels />
                <div className={styles.accordLegend}>
                  {fragrance.accords.map(a => (
                    <div key={a.name} className={styles.accordPill}>
                      <div className={styles.accDot} style={{ background: `var(--acc-${a.name.toLowerCase()}, #C0B8B0)` }} />
                      {a.name} {a.percentage}%
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button className="btn-primary"><Star weight="bold" size={14} /> Rate this</button>
              <button className="btn-secondary"><Heart weight="bold" size={14} /> Wishlist</button>
              <button className="btn-secondary"><ListPlus weight="bold" size={14} /> Add to list</button>
              <button className={styles.iconOnly} aria-label="Share"><Export weight="bold" size={18} /></button>
            </div>
          </div>

          {/* Buy panel */}
          <aside className={styles.buyPanel} aria-label={`Buy ${fragrance.name}`}>
            <div className={styles.buyHead}>
              <div className={styles.buyTitle}>Best price</div>
              <div className={styles.buyPriceRow}>
                <span className={styles.buyPrice}>£{lowestPrice?.price}</span>
                <span className={styles.buyMeta}>{lowestPrice?.size_ml}ml {fragrance.concentration}</span>
              </div>
            </div>

            <div className={styles.sizeRow} role="group" aria-label="Select size">
              {['30ml', '100ml', '200ml'].map((s, i) => (
                <button key={s} className={`${styles.sizeBtn}${i === 1 ? ` ${styles.sizeBtnActive}` : ''}`}>{s}</button>
              ))}
            </div>

            <div className={styles.retailers}>
              {fragrance.prices?.sort((a, b) => a.price - b.price).map((p, i) => (
                <a
                  key={p.id}
                  href={p.affiliate_url}
                  className={styles.retailerRow}
                  rel="sponsored noopener"
                  target="_blank"
                  aria-label={`Buy from ${p.retailer.name} for £${p.price}`}
                >
                  <Storefront weight="bold" size={16} className={styles.retailerIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.retailerName}>{p.retailer.name}</div>
                    <div className={styles.retailerNote}>Free UK delivery</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i === 0 && <span className={styles.bestBadge}>Best price</span>}
                    <span className={styles.retailerPrice}>£{p.price}</span>
                  </div>
                </a>
              ))}
            </div>

            <div className={styles.buyFoot}>
              <button className={styles.trackBtn}><Bell weight="bold" size={13} /> Track price drops</button>
            </div>
          </aside>

        </section>

        {/* ── Community ratings ─────────────────────── */}
        <section className={styles.communitySection} aria-labelledby="ratings-heading">
          <h2 className={styles.sectionTitle} id="ratings-heading">Community <em>ratings</em></h2>

          <div className={styles.ratingsGrid}>
            {[
              { title: 'Longevity', icon: <Clock weight="fill" size={14} />, data: longevityDist,
                order: ['24hrs+', '12-24hrs', '8-12hrs', '4-8hrs', 'under-4hrs'],
                labels: ['24 hrs+', '12–24 hrs', '8–12 hrs', '4–8 hrs', 'Under 4hrs'] },
              { title: 'Sillage',   icon: <Wind weight="fill" size={14} />,  data: sillage_dist,
                order: ['enormous', 'strong', 'moderate', 'soft', 'intimate'],
                labels: ['Enormous', 'Strong', 'Moderate', 'Soft', 'Intimate'] },
              { title: 'Best season', icon: <Sun weight="fill" size={14} />, data: { Spring: 32, Summer: 24, Autumn: 28, Winter: 16 },
                order: ['Spring', 'Summer', 'Autumn', 'Winter'],
                labels: ['Spring', 'Summer', 'Autumn', 'Winter'] },
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

          {/* Recommend bar */}
          <div className={styles.recommendBar} role="region" aria-label="Recommendation summary">
            <div className={styles.recommendPct}>{fragrance.recommend_pct}%</div>
            <div>
              <div className={styles.recommendLabel}>recommend {fragrance.name}</div>
              <div className={styles.recommendSub}>Based on {fragrance.rating_count?.toLocaleString()} community ratings</div>
            </div>
          </div>
        </section>

        {/* ── Notes pyramid ─────────────────────────── */}
        {(fragrance.top_notes || fragrance.heart_notes || fragrance.base_notes) && (
          <section className={styles.notesSection} aria-labelledby="notes-heading">
            <h2 className={styles.sectionTitle} id="notes-heading">Fragrance <em>notes</em></h2>
            <div className={styles.pyramid}>
              {[
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
              ))}
            </div>
          </section>
        )}

        {/* ── Dupes ─────────────────────────────────── */}
        {dupes.length > 0 && (
          <section className={styles.dupesSection} aria-labelledby="dupes-heading">
            <div className={styles.dupeSectionHead}>
              <h2 className={styles.sectionTitle} id="dupes-heading">Community <em>dupes</em></h2>
              <Link href={`/dupes/${slug}`} className="section-link">
                All dupes <ArrowRight weight="bold" size={12} />
              </Link>
            </div>
            <p className={styles.dupesSub}>Matched by members testing side-by-side</p>
            <div className={styles.dupeGrid}>
              {dupes.map(d => (
                <div key={d.id} className={styles.dupeCard}>
                  <div className={styles.dupeMatch}>{d.match_pct}%</div>
                  <div className={styles.dupeCardName}>{d.dupe_name}</div>
                  <div className={styles.dupeCardBrand}>{d.dupe_brand}</div>
                  <div className={styles.dupePriceRow}>
                    <span className={styles.dupeCardPrice}>£{d.price}</span>
                    <span className={styles.dupeSave}>Save £{d.saves}</span>
                  </div>
                  <div className={styles.dupeVotes}>{d.vote_count.toLocaleString()} members confirmed</div>
                  <button className={styles.dupeBuyBtn}><ShoppingBag weight="bold" size={12} /> Buy now</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Vote card ─────────────────────────────── */}
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
