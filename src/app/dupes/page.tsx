import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccordStrip from '@/components/AccordStrip'
import { getFragrances, getDupes, getTrendingByReddit } from '@/lib/db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Dupe Finder',
  description: 'Find cheaper fragrance alternatives based on scent similarity.',
}

interface Props {
  searchParams: Promise<{ search?: string }>
}

export default async function DupesPage({ searchParams }: Props) {
  const { search } = await searchParams
  const query = search?.trim() ?? ''

  let sourceFragrance = null
  let dupes: Awaited<ReturnType<typeof getDupes>> = []

  if (query) {
    const { fragrances } = await getFragrances({ search: query, limit: 1 })
    sourceFragrance = fragrances[0] ?? null
    if (sourceFragrance) dupes = await getDupes(sourceFragrance.id, 8)
  }

  // Landing state — offer trending fragrances as starting points
  const starters = query ? [] : (await getTrendingByReddit(8)).filter(f => f.image_url).slice(0, 4)

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.page}>

          <div className={styles.hero}>
            <p className={styles.eyebrow}>Scent similarity engine</p>
            <h1 className={styles.heading}>Fragrance <em>Dupe Finder</em></h1>
            <p className={styles.sub}>
              Search any fragrance to find similar scents — sorted by accord match score.
            </p>

            <form className={styles.searchForm} method="get">
              <div className={styles.searchWrap}>
                <MagnifyingGlass className={styles.searchIcon} weight="bold" size={16} />
                <input
                  type="search"
                  name="search"
                  defaultValue={query}
                  placeholder="Search a fragrance, e.g. Aventus, Baccarat Rouge…"
                  className={styles.searchInput}
                  autoFocus={!query}
                  aria-label="Search fragrance"
                />
                <button type="submit" className={`btn-primary ${styles.searchBtn}`}>Find dupes</button>
              </div>
            </form>
          </div>

          {query && !sourceFragrance && (
            <div className={styles.noResult}>
              <p>No fragrance found for &ldquo;{query}&rdquo;. Try a different name.</p>
            </div>
          )}

          {sourceFragrance && (
            <>
              <div className={styles.sourceRow}>
                <p className={styles.sourceLabel}>Showing dupes for</p>
                <Link href={`/fragrance/${sourceFragrance.slug}`} className={styles.sourceCard}>
                  {sourceFragrance.image_url && (
                    <Image src={sourceFragrance.image_url} alt={sourceFragrance.name} width={40} height={40} style={{ objectFit: 'contain' }} />
                  )}
                  <div>
                    <p className={styles.sourceBrand}>{sourceFragrance.brand.name}</p>
                    <p className={styles.sourceName}>{sourceFragrance.name}</p>
                  </div>
                </Link>
              </div>

              {dupes.length === 0 ? (
                <p className={styles.noResult}>No similar fragrances found — try a fragrance with scent profile data.</p>
              ) : (
                <div className={styles.dupeGrid}>
                  {dupes.map(d => (
                    <Link key={d.id} href={`/fragrance/${d.slug}`} className={styles.dupeCard}>
                      <div className={styles.simBadge}>{d.similarity}% match</div>
                      <div className={styles.dupeImg}>
                        {d.image_url
                          ? <Image src={d.image_url} alt={d.name} fill sizes="120px" style={{ objectFit: 'contain', padding: '8px' }} />
                          : <div className={styles.dupeImgPlaceholder} />
                        }
                      </div>
                      {d.accords && d.accords.length > 0 && <AccordStrip accords={d.accords} height={4} gap={0} />}
                      <div className={styles.dupeInfo}>
                        <p className={styles.dupeBrand}>{d.brand.name}</p>
                        <p className={styles.dupeName}>{d.name}</p>
                        {d.avg_score && (
                          <p className={styles.dupeScore}>{d.avg_score.toFixed(1)}<span>/10</span></p>
                        )}
                        {d.accords && d.accords.length > 0 && (
                          <div className={styles.dupeAccords}>
                            {d.accords.slice(0, 3).map(a => (
                              <span key={a.name} className={styles.dupeAccord}>{a.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {!query && (
            <>
              <div className={styles.suggestions}>
                <p className={styles.suggestLabel}>Popular searches</p>
                <div className={styles.suggestRow}>
                  {['Aventus', 'Baccarat Rouge 540', 'Sauvage', 'Black Opium', 'Good Girl', 'Bleu de Chanel'].map(s => (
                    <Link key={s} href={`/dupes?search=${encodeURIComponent(s)}`} className={styles.suggestChip}>{s}</Link>
                  ))}
                </div>
              </div>

              {starters.length > 0 && (
                <div className={styles.starters}>
                  <p className={styles.suggestLabel}>Or start from what everyone&rsquo;s talking about</p>
                  <div className={styles.starterGrid}>
                    {starters.map(f => (
                      <Link key={f.id} href={`/dupes/${f.slug}`} className={styles.starterCard}>
                        <div className={styles.starterImg}>
                          {f.image_url
                            ? <Image src={f.image_url} alt={f.name} fill sizes="160px" style={{ objectFit: 'contain', padding: '10px' }} />
                            : <div className={styles.dupeImgPlaceholder} />
                          }
                        </div>
                        {f.accords && f.accords.length > 0 && <AccordStrip accords={f.accords} height={4} gap={0} />}
                        <div className={styles.starterInfo}>
                          <p className={styles.dupeBrand}>{f.brand.name}</p>
                          <p className={styles.dupeName}>{f.name}</p>
                          <p className={styles.starterCta}>Find dupes →</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
