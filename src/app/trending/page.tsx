import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { TrendUp, Fire, Star } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import { getTrendingByReddit, getTopRatedFragrances } from '@/lib/db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Trending Fragrances',
  description: 'The most discussed and highest rated fragrances right now, powered by Reddit community sentiment.',
}

export const revalidate = 3600

export default async function TrendingPage() {
  const [redditTrending, topRated] = await Promise.all([
    getTrendingByReddit(12),
    getTopRatedFragrances(12),
  ])

  return (
    <>
      <Nav />
      <main className={styles.main}>

        {/* ── Header ────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>Trending <em>fragrances</em></h1>
            <p className={styles.sub}>What the community is talking about — powered by Reddit sentiment analysis and Perfy community ratings</p>
          </div>
        </div>

        <div className={styles.body}>

          {/* ── Most discussed on Reddit ─────────── */}
          {redditTrending.length > 0 && (
            <section className={styles.section} aria-labelledby="reddit-heading">
              <div className={styles.sectionHead}>
                <div className={styles.sectionLabel}>
                  <Fire size={16} weight="fill" className={styles.iconOrange} aria-hidden="true" />
                  <h2 className={styles.sectionTitle} id="reddit-heading">Most discussed on Reddit</h2>
                </div>
                <p className={styles.sectionSub}>Ranked by number of Reddit posts analysed in the last 3 years</p>
              </div>
              <div className={styles.grid}>
                {redditTrending.map((f, i) => (
                  <Link key={f.id} href={`/fragrance/${f.slug}`} className={styles.card}>
                    <div className={styles.cardRank}>{i + 1}</div>
                    <div className={styles.cardImg}>
                      {f.image_url
                        ? <Image src={f.image_url} alt={f.name} fill sizes="120px" style={{ objectFit: 'contain', padding: '8px' }} />
                        : <div className={styles.cardImgEmpty} />}
                    </div>
                    {(f.accords?.length ?? 0) > 0 && <AccordStrip accords={f.accords!} height={3} gap={0} />}
                    <div className={styles.cardBody}>
                      <div className={styles.cardBrand}>{f.brand.name}</div>
                      <div className={styles.cardName}>{f.name}</div>
                      <div className={styles.cardMeta}>
                        <span className={styles.redditPill}>
                          <Fire size={10} weight="fill" aria-hidden="true" />
                          {f.mention_count} posts
                        </span>
                        {f.avg_reddit_score !== null && (
                          <span className={styles.scorePill}>{f.avg_reddit_score.toFixed(1)}/10</span>
                        )}
                        {f.mentions_this_month > f.mentions_last_month && (
                          <span className={styles.risingPill}>
                            <TrendUp size={9} weight="bold" aria-hidden="true" /> rising
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <p className={styles.attribution}>Sentiment sourced from r/fragrance &amp; r/fragranceclones. AI-analysed.</p>
            </section>
          )}

          {/* ── Top rated by community ───────────── */}
          {topRated.length > 0 && (
            <section className={styles.section} aria-labelledby="rated-heading">
              <div className={styles.sectionHead}>
                <div className={styles.sectionLabel}>
                  <Star size={16} weight="fill" className={styles.iconGold} aria-hidden="true" />
                  <h2 className={styles.sectionTitle} id="rated-heading">Highest community ratings</h2>
                </div>
                <p className={styles.sectionSub}>Ranked by Perfy community score — fragrances with 3+ ratings</p>
              </div>
              <div className={styles.grid}>
                {topRated.map((f, i) => (
                  <Link key={f.id} href={`/fragrance/${f.slug}`} className={styles.card}>
                    <div className={styles.cardRank}>{i + 1}</div>
                    <div className={styles.cardImg}>
                      {f.image_url
                        ? <Image src={f.image_url} alt={f.name} fill sizes="120px" style={{ objectFit: 'contain', padding: '8px' }} />
                        : <div className={styles.cardImgEmpty} />}
                    </div>
                    {(f.accords?.length ?? 0) > 0 && <AccordStrip accords={f.accords!} height={3} gap={0} />}
                    <div className={styles.cardBody}>
                      <div className={styles.cardBrand}>{f.brand.name}</div>
                      <div className={styles.cardName}>{f.name}</div>
                      <div className={styles.cardMeta}>
                        {f.avg_score && (
                          <span className={styles.scorePill}>{f.avg_score.toFixed(1)}/10</span>
                        )}
                        {f.rating_count && (
                          <span className={styles.countPill}>{f.rating_count.toLocaleString()} ratings</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {redditTrending.length === 0 && topRated.length === 0 && (
            <div className={styles.empty}>
              <p>No trending data yet — check back soon as the community grows.</p>
            </div>
          )}

        </div>
      </main>
      <Footer />

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <div className="mobile-nav-inner">
          {[
            { href: '/',         label: 'Home' },
            { href: '/discover', label: 'Discover' },
            { href: '/dupes',    label: 'Dupes' },
            { href: '/trending', label: 'Trending' },
            { href: '/profile',  label: 'Profile' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="mob-nav-item">{label}</Link>
          ))}
        </div>
      </nav>
    </>
  )
}
