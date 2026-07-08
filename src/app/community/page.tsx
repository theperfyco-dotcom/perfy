import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ChatCircleText, Fire, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getRecentStatements, getTrendingByReddit } from '@/lib/db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Community',
  description: 'What the fragrance community is saying — recent takes, ratings, and the scents everyone is talking about.',
}

export const revalidate = 300

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)    return 'just now'
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default async function CommunityPage() {
  const [statements, trending] = await Promise.all([
    getRecentStatements(20),
    getTrendingByReddit(6),
  ])

  return (
    <>
      <Nav />
      <main className={styles.main}>

        <div className={styles.header}>
          <h1 className={styles.title}>Community</h1>
          <p className={styles.sub}>
            What fragrance lovers are saying right now — every take is anonymous, no account needed.
          </p>
        </div>

        <div className={styles.columns}>

          {/* ── Recent statements feed ── */}
          <section className={styles.feed} aria-labelledby="feed-heading">
            <h2 className={styles.colHeading} id="feed-heading">
              <ChatCircleText size={18} weight="duotone" aria-hidden="true" /> Latest takes
            </h2>

            {statements.length > 0 ? (
              <div className={styles.feedList}>
                {statements.map(s => (
                  <article key={s.id} className={styles.feedCard}>
                    {s.fragrance && (
                      <Link href={`/fragrance/${s.fragrance.slug}`} className={styles.feedFragrance}>
                        <span className={styles.feedBrand}>{s.fragrance.brand_name}</span>
                        <span className={styles.feedName}>{s.fragrance.name}</span>
                      </Link>
                    )}
                    <p className={styles.feedBody}>{s.body}</p>
                    <div className={styles.feedMeta}>
                      {s.is_positive !== null && (
                        <span className={s.is_positive ? styles.tagPos : styles.tagNeg}>
                          {s.is_positive ? '+ Positive' : '− Negative'}
                        </span>
                      )}
                      <span className={styles.feedTime}>{timeAgo(s.created_at)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.feedEmpty}>
                <p>No community takes yet — be the first.</p>
                <p className={styles.feedEmptySub}>
                  Open any fragrance page and share how it smells, wears, or when you&rsquo;d reach for it.
                </p>
                <Link href="/trending" className="btn-primary">Pick a fragrance to review</Link>
              </div>
            )}
          </section>

          {/* ── Most discussed sidebar ── */}
          <aside className={styles.side} aria-labelledby="side-heading">
            <h2 className={styles.colHeading} id="side-heading">
              <Fire size={18} weight="duotone" aria-hidden="true" /> Most discussed
            </h2>
            <div className={styles.sideList}>
              {trending.map((f, i) => (
                <Link key={f.id} href={`/fragrance/${f.slug}`} className={styles.sideRow}>
                  <span className={styles.sideRank}>{i + 1}</span>
                  <div className={styles.sideImg}>
                    {f.image_url && (
                      <Image src={f.image_url} alt={f.name} fill sizes="48px" style={{ objectFit: 'contain', padding: '4px' }} />
                    )}
                  </div>
                  <div className={styles.sideInfo}>
                    <span className={styles.sideBrand}>{f.brand.name}</span>
                    <span className={styles.sideName}>{f.name}</span>
                    <span className={styles.sideStat}>
                      {f.mention_count} Reddit posts{f.avg_reddit_score ? ` · ${f.avg_reddit_score.toFixed(1)}/10` : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/trending" className={styles.sideMore}>
              All trending <ArrowRight weight="bold" size={12} aria-hidden="true" />
            </Link>
          </aside>

        </div>
      </main>
      <Footer />
    </>
  )
}
