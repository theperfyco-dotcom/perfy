import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FragranceCard from '@/components/FragranceCard'
import { getFragrances } from '@/lib/db'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Discover Fragrances',
  description: 'Browse and filter 4,000+ fragrances by gender, scent family, and more.',
}

interface Props {
  searchParams: Promise<{
    gender?: string
    accord?: string
    sort?: string
    search?: string
    page?: string
  }>
}

const ACCORDS = ['Fresh', 'Floral', 'Woody', 'Spicy', 'Citrus', 'Amber', 'Musky', 'Oud', 'Leather', 'Aromatic']
const PAGE_SIZE = 48

export default async function DiscoverPage({ searchParams }: Props) {
  const params = await searchParams
  const gender = params.gender
  const accord = params.accord
  const sort   = params.sort ?? 'newest'
  const search = params.search
  const page   = Math.max(1, parseInt(params.page ?? '1', 10))

  const { fragrances, total } = await getFragrances({ gender, accord, sort, search, page, limit: PAGE_SIZE })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function filterHref(overrides: Record<string, string | undefined>) {
    const merged = { gender, accord, sort, search, page: '1', ...overrides }
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    const qs = p.toString()
    return `/discover${qs ? `?${qs}` : ''}`
  }

  function pageHref(p: number) {
    return filterHref({ page: String(p) })
  }

  return (
    <>
      <Nav />
      <main className={styles.main}>

        {/* ── Header ───────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <h1 className={styles.title}>
              Discover <em>fragrances</em>
            </h1>
            <p className={styles.sub}>
              {total.toLocaleString()} fragrances · Browse, filter, and find your next signature scent
            </p>
          </div>
        </div>

        <div className={styles.layout}>

          {/* ── Sidebar filters ───────────── */}
          <aside className={styles.sidebar}>

            {/* Search */}
            <form method="GET" action="/discover" className={styles.searchForm}>
              {gender && <input type="hidden" name="gender" value={gender} />}
              {accord && <input type="hidden" name="accord" value={accord} />}
              {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
              <div className={styles.searchWrap}>
                <MagnifyingGlass size={14} className={styles.searchIcon} aria-hidden="true" />
                <input
                  type="search"
                  name="search"
                  defaultValue={search}
                  placeholder="Search fragrances…"
                  className={styles.searchInput}
                  aria-label="Search fragrances"
                />
              </div>
            </form>

            {/* Gender */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Gender</div>
              <div className={styles.filterOptions}>
                {[
                  { label: 'All', value: undefined },
                  { label: 'Masculine', value: 'masculine' },
                  { label: 'Feminine', value: 'feminine' },
                  { label: 'Unisex', value: 'unisex' },
                ].map(({ label, value }) => (
                  <Link
                    key={label}
                    href={filterHref({ gender: value })}
                    className={`${styles.filterOpt} ${(gender ?? undefined) === value ? styles.filterOptActive : ''}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Scent family */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Scent family</div>
              <div className={styles.filterOptions}>
                <Link
                  href={filterHref({ accord: undefined })}
                  className={`${styles.filterOpt} ${!accord ? styles.filterOptActive : ''}`}
                >
                  All families
                </Link>
                {ACCORDS.map(a => (
                  <Link
                    key={a}
                    href={filterHref({ accord: a })}
                    className={`${styles.filterOpt} ${accord === a ? styles.filterOptActive : ''}`}
                  >
                    <span className={styles.accordDot} style={{ background: `var(--acc-${a.toLowerCase()}, #C0B8B0)` }} />
                    {a}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Sort by</div>
              <div className={styles.filterOptions}>
                {[
                  { label: 'Name A–Z', value: 'name' },
                  { label: 'Newest first', value: 'newest' },
                ].map(({ label, value }) => (
                  <Link
                    key={value}
                    href={filterHref({ sort: value })}
                    className={`${styles.filterOpt} ${sort === value ? styles.filterOptActive : ''}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Reset */}
            {(gender || accord || search || sort !== 'newest') && (
              <Link href="/discover" className={styles.resetLink}>Clear all filters</Link>
            )}

          </aside>

          {/* ── Main grid ─────────────────── */}
          <div className={styles.content}>

            {/* Active filter pills */}
            {(gender || accord || search) && (
              <div className={styles.activePills}>
                {gender && (
                  <Link href={filterHref({ gender: undefined })} className={styles.activePill}>
                    {gender} ×
                  </Link>
                )}
                {accord && (
                  <Link href={filterHref({ accord: undefined })} className={styles.activePill}>
                    {accord} ×
                  </Link>
                )}
                {search && (
                  <Link href={filterHref({ search: undefined })} className={styles.activePill}>
                    &ldquo;{search}&rdquo; ×
                  </Link>
                )}
              </div>
            )}

            {fragrances.length === 0 ? (
              <div className={styles.empty}>
                <p>No fragrances match these filters.</p>
                <Link href="/discover" className={styles.resetLink}>Clear filters</Link>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {fragrances.map(f => <FragranceCard key={f.id} fragrance={f} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className={styles.pagination} aria-label="Pagination">
                    {page > 1 ? (
                      <Link href={pageHref(page - 1)} className={styles.pageBtn} aria-label="Previous page">
                        <ArrowLeft size={14} weight="bold" />
                      </Link>
                    ) : (
                      <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`} aria-disabled="true">
                        <ArrowLeft size={14} weight="bold" />
                      </span>
                    )}

                    <div className={styles.pageNums}>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let p: number
                        if (totalPages <= 7) {
                          p = i + 1
                        } else if (page <= 4) {
                          p = i + 1
                        } else if (page >= totalPages - 3) {
                          p = totalPages - 6 + i
                        } else {
                          p = page - 3 + i
                        }
                        return (
                          <Link
                            key={p}
                            href={pageHref(p)}
                            className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ''}`}
                            aria-current={p === page ? 'page' : undefined}
                          >
                            {p}
                          </Link>
                        )
                      })}
                    </div>

                    {page < totalPages ? (
                      <Link href={pageHref(page + 1)} className={styles.pageBtn} aria-label="Next page">
                        <ArrowRight size={14} weight="bold" />
                      </Link>
                    ) : (
                      <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`} aria-disabled="true">
                        <ArrowRight size={14} weight="bold" />
                      </span>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
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
