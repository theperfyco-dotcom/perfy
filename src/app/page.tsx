import Link from 'next/link'
import { MagnifyingGlass, ArrowRight, Lightning, Sparkle } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FragranceCard from '@/components/FragranceCard'
import PaletteRow from '@/components/PaletteRow'
import { getTopFragrances } from '@/lib/db'
import styles from './page.module.css'

export default async function HomePage() {
  const fragrances = await getTopFragrances(20)
  const trending   = fragrances.slice(0, 4)
  const palette    = fragrances.slice(0, 6)

  return (
    <>
      <Nav />
      <main>

        {/* ── Hero ───────────────────────────────────── */}
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroText}>
            <div className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowLine} aria-hidden="true" />
              Community fragrance ratings
            </div>
            <h1 className={styles.heroH1} id="hero-heading">
              Find your<br />
              next <em>signature</em><br />
              scent
            </h1>
            <p className={styles.heroSub}>
              In-depth community ratings on longevity, sillage, and scent profile. The fragrance database trusted by enthusiasts.
            </p>

            <div className={styles.heroSearch} role="search">
              <div className={styles.heroSearchIcon} aria-hidden="true">
                <MagnifyingGlass weight="bold" size={16} />
              </div>
              <input
                type="search"
                placeholder="Search 50,000+ fragrances…"
                aria-label="Search fragrances"
                className={styles.heroSearchInput}
              />
              <button className={styles.heroSearchBtn}>Search</button>
            </div>

            <div className={styles.heroTags} aria-label="Trending searches">
              <span className={styles.heroTagLabel}>Trending</span>
              {['Baccarat Rouge', 'Sauvage EDP', 'Aventus', 'Good Girl'].map(t => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className={styles.heroTag}>{t}</Link>
              ))}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroVisualLabel}>Top rated this week</div>
            {fragrances.slice(0, 5).map(f => {
              const total = (f.accords ?? []).reduce((s, a) => s + a.percentage, 0)
              return (
                <Link key={f.id} href={`/fragrance/${f.slug}`} className={styles.heroPaletteRow}>
                  <div className={styles.heroSwatches} aria-hidden="true">
                    {(f.accords ?? []).map(a => (
                      <div key={a.name} style={{ flex: a.percentage / total, background: '#C4A07A', height: '100%' }} />
                    ))}
                  </div>
                  <div className={styles.heroPalInfo}>
                    <div className={styles.heroPalName}>{f.name}</div>
                    <div className={styles.heroPalBrand}>{f.brand.name}</div>
                  </div>
                  <div className={styles.heroPalScore}>{f.avg_score?.toFixed(1)}</div>
                </Link>
              )
            })}

            <div className={styles.heroStats}>
              {[['50k+', 'Fragrances'], ['180k', 'Members'], ['8,400', 'Dupes found']].map(([n, l]) => (
                <div key={l} className={styles.heroStat}>
                  <div className={styles.heroStatNum}>{n}</div>
                  <div className={styles.heroStatLabel}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trending ────────────────────────────────── */}
        <section aria-labelledby="trending-heading">
          <div className="page">
            <div className="section-head">
              <h2 className="section-title" id="trending-heading">Trending <em>now</em></h2>
              <Link href="/trending" className="section-link">View all <ArrowRight weight="bold" size={12} /></Link>
            </div>
            <div className="filter-row" role="group" aria-label="Filter fragrances">
              {['All', "Men's", "Women's", 'Unisex', 'Niche', 'Under £50', 'Woody', 'Floral', 'Fresh'].map((f, i) => (
                <button key={f} className={`filter-chip${i === 0 ? ' on' : ''}`}>{f}</button>
              ))}
            </div>
            <div className={styles.cardGrid}>
              {trending.map((f, i) => <FragranceCard key={f.id} fragrance={f} rank={i + 1} />)}
            </div>
          </div>
        </section>

        {/* ── Palette discovery ───────────────────────── */}
        <section className={styles.paletteSection} aria-labelledby="palette-heading">
          <div className="page">
            <div className="section-head">
              <div>
                <h2 className="section-title" id="palette-heading">Discover by <em>scent</em></h2>
                <p className={styles.paletteSub}>Hover any row to reveal the accord breakdown</p>
              </div>
              <Link href="/discover" className="section-link">Explore all <ArrowRight weight="bold" size={12} /></Link>
            </div>
            <div className={styles.paletteList} role="list">
              {palette.map((f, i) => <PaletteRow key={f.id} fragrance={f} rank={i + 1} />)}
            </div>
          </div>
        </section>

        {/* ── Dupe finder banner ──────────────────────── */}
        <section className={styles.dupeBanner} aria-labelledby="dupe-heading">
          <div className={styles.dupeBannerInner}>
            <div>
              <div className={styles.dupeEyebrow}>Dupe finder</div>
              <h2 className={styles.dupeTitle} id="dupe-heading">
                Same scent.<br /><em>A fraction</em> of the cost.
              </h2>
              <p className={styles.dupeDesc}>
                Our community has matched 8,400+ fragrance pairs by scent profile. Find what smells like your favourite — and save up to £257 a bottle.
              </p>
              <Link href="/dupes" className={`btn-primary ${styles.dupeBtn}`}>
                <Lightning weight="bold" size={14} /> Find your dupe
              </Link>
            </div>
            <div className={styles.dupeVisual}>
              <div className={styles.dupeCompareRow}>
                <div className={styles.dupeItem}>
                  <div className={styles.dupeItemTag}>Original</div>
                  <div className={styles.dupeItemName}>Creed Aventus</div>
                  <div className={styles.dupeItemBrand}>100ml EDP</div>
                  <div className={`${styles.dupePrice} ${styles.priceOld}`}>£275</div>
                </div>
                <div className={styles.vs} aria-hidden="true">vs</div>
                <div className={styles.dupeItem}>
                  <div className={styles.dupeItemTag}>Community dupe</div>
                  <div className={styles.dupeItemName}>Vibrant Leather</div>
                  <div className={styles.dupeItemBrand}>Zara · Parfum</div>
                  <div className={`${styles.dupePrice} ${styles.priceNew}`}>£18</div>
                </div>
              </div>
              <div className={styles.dupeBarLabel}>
                <span>Community similarity</span>
                <strong>89% match · save £257</strong>
              </div>
              <div className={styles.dupeBarTrack} role="progressbar" aria-valuenow={89} aria-valuemin={0} aria-valuemax={100}>
                <div className={styles.dupeBarFill} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Join CTA ─────────────────────────────────── */}
        <section className={styles.joinSection} aria-labelledby="join-heading">
          <div className="page">
            <div className={styles.joinCard}>
              <Sparkle weight="fill" size={32} className={styles.joinIcon} aria-hidden="true" />
              <h2 className={styles.joinTitle} id="join-heading">Build your scent profile</h2>
              <p className={styles.joinSub}>Rate fragrances, track your collection, follow people with great taste.</p>
              <Link href="/join" className="btn-primary">Join free — it takes 30 seconds</Link>
            </div>
          </div>
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
