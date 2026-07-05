import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUserRatings } from '@/lib/db'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'My Profile' }

const LONGEVITY_LABELS: Record<string, string> = {
  'under-4hrs': 'Under 4 hrs', '4-8hrs': '4–8 hrs',
  '8-12hrs': '8–12 hrs', '12-24hrs': '12–24 hrs', '24hrs+': '24 hrs+',
}
const SILLAGE_LABELS: Record<string, string> = {
  intimate: 'Intimate', soft: 'Soft', moderate: 'Moderate', strong: 'Strong', enormous: 'Enormous',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const ratings = await getUserRatings(user.id)
  const joinDate = new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const initial = (user.email ?? 'U')[0].toUpperCase()

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.page}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.headerInfo}>
              <p className={styles.email}>{user.email}</p>
              <p className={styles.since}>Member since {joinDate}</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{ratings.length}</span>
              <span className={styles.statLabel}>Ratings</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>
                {ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : '—'}
              </span>
              <span className={styles.statLabel}>Avg score</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>
                {ratings.filter(r => r.recommend).length}
              </span>
              <span className={styles.statLabel}>Recommended</span>
            </div>
          </div>

          {/* Ratings list */}
          <section>
            <h2 className={styles.sectionTitle}>My <em>ratings</em></h2>

            {ratings.length === 0 ? (
              <div className={styles.empty}>
                <p>No ratings yet.</p>
                <Link href="/discover" className="btn-primary">Discover fragrances</Link>
              </div>
            ) : (
              <div className={styles.ratingsList}>
                {ratings.map(r => (
                  <Link key={r.id} href={`/fragrance/${r.fragrance.slug}`} className={styles.ratingRow}>
                    <div className={styles.ratingImg}>
                      {r.fragrance.image_url ? (
                        <Image src={r.fragrance.image_url} alt={r.fragrance.name} fill sizes="56px" style={{ objectFit: 'contain' }} />
                      ) : (
                        <div className={styles.ratingImgPlaceholder} />
                      )}
                    </div>
                    <div className={styles.ratingInfo}>
                      <p className={styles.ratingBrand}>{r.fragrance.brand.name}</p>
                      <p className={styles.ratingName}>{r.fragrance.name}</p>
                      <div className={styles.ratingMeta}>
                        {r.longevity && <span>{LONGEVITY_LABELS[r.longevity] ?? r.longevity}</span>}
                        {r.sillage   && <span>{SILLAGE_LABELS[r.sillage]   ?? r.sillage}</span>}
                        {r.season?.map(s => <span key={s} className={styles.season}>{s[0].toUpperCase() + s.slice(1)}</span>)}
                      </div>
                    </div>
                    <div className={styles.ratingRight}>
                      <div className={styles.scoreBadge}>{r.score}<span>/10</span></div>
                      {r.recommend != null && (
                        <span className={r.recommend ? styles.recYes : styles.recNo}>
                          {r.recommend ? 'Recommended' : 'Not recommended'}
                        </span>
                      )}
                      <p className={styles.ratingDate}>
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
