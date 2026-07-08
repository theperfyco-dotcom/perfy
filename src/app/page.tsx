import Link from 'next/link'
import { ArrowRight, Lightning, Sparkle } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FragranceCard from '@/components/FragranceCard'
import PaletteRow from '@/components/PaletteRow'
import HomeSearch from '@/components/HomeSearch'
import { getTopFragrances, getTrendingByReddit, type TrendingFragrance } from '@/lib/db'
import { getAccordColor } from '@/lib/accord-colors'
import styles from './page.module.css'

export default async function HomePage() {
  // Reddit-ranked fragrances lead the page — they have real community signal
  // (scores, mention counts, images). Alphabetical fallback only if empty.
  const reddit = await getTrendingByReddit(12)
  const fragrances: TrendingFragrance[] = reddit.length >= 6
    ? reddit
    : (await getTopFragrances(12)).map(f => ({
        ...f, mention_count: 0, avg_reddit_score: null,
        avg_reddit_sentiment: null, mentions_this_month: 0, mentions_last_month: 0,
      }))

  const heroList = fragrances.filter(f => f.avg_reddit_score).slice(0, 5)
  const trending = fragrances.slice(0, 4)
  const palette  = fragrances.filter(f => (f.accords ?? []).length > 0).slice(0, 6)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Perfy',
      url: 'https://perfy.io',
      description: 'Community fragrance ratings on longevity, sillage and value — powered by real Reddit reviews.',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://perfy.io/discover?search={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Perfy',
      url: 'https://perfy.io',
      email: 'hello@perfy.io',
      description: 'The community fragrance database.',
    },
  ]

  return (
    <>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

            <HomeSearch />

            <div className={styles.heroTags} aria-label="Trending searches">
              <span className={styles.heroTagLabel}>Trending</span>
              {['Baccarat Rouge', 'Sauvage EDP', 'Aventus', 'Good Girl'].map(t => (
                <Link key={t} href={`/discover?search=${encodeURIComponent(t)}`} className={styles.heroTag}>{t}</Link>
              ))}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroVisualLabel}>Most talked about on Reddit</div>
            {heroList.map(f => {
              const total = (f.accords ?? []).reduce((s, a) => s + a.percentage, 0)
              return (
                <Link key={f.id} href={`/fragrance/${f.slug}`} className={styles.heroPaletteRow}>
                  <div className={styles.heroSwatches} aria-hidden="true">
                    {(f.accords ?? []).map(a => (
                      <div key={a.name} style={{ flex: a.percentage / total, background: a.color_hex ?? getAccordColor(a.name), height: '100%' }} />
                    ))}
                  </div>
                  <div className={styles.heroPalInfo}>
                    <div className={styles.heroPalName}>{f.name}</div>
                    <div className={styles.heroPalBrand}>{f.brand.name}</div>
                  </div>
                  <div className={styles.heroPalScore}>{(f.avg_score ?? f.avg_reddit_score)?.toFixed(1)}</div>
                </Link>
              )
            })}

            <div className={styles.heroStats}>
              {[['4,000+', 'Fragrances'], ['450+', 'Brands'], ['Daily', 'Reddit analysis']].map(([n, l]) => (
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
            <p className={styles.trendingSub}>Ranked by Reddit discussion across r/fragrance &amp; more</p>
            <div className={styles.cardGrid}>
              {trending.map((f, i) => (
                <FragranceCard
                  key={f.id}
                  fragrance={f}
                  rank={i + 1}
                  redditScore={f.avg_reddit_score}
                  redditMentions={f.mention_count}
                />
              ))}
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
              {palette.map((f, i) => (
                <PaletteRow
                  key={f.id}
                  fragrance={f}
                  rank={i + 1}
                  score={f.avg_reddit_score}
                  countText={f.mention_count > 0 ? `${f.mention_count} Reddit reviews` : undefined}
                />
              ))}
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
                Our similarity engine matches fragrances by accord profile. Find what smells like your favourite — for a fraction of the price.
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
                <span>Accord similarity</span>
                <strong>89% match</strong>
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
              <Link href="/trending" className="btn-primary">Start rating — no account needed</Link>
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
            { href: '/notes',    label: 'Notes' },
            { href: '/profile',  label: 'Profile' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="mob-nav-item">{label}</Link>
          ))}
        </div>
      </nav>
    </>
  )
}
