import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div>
          <div className={styles.logo}>Perf<em>y</em></div>
          <p className={styles.tagline}>The modern fragrance community. Rate, discover, buy smarter.</p>
        </div>
        <div>
          <h3 className={styles.colTitle}>Discover</h3>
          <nav className={styles.links} aria-label="Discover">
            <Link href="/trending"       className={styles.link}>Trending</Link>
            <Link href="/dupes"          className={styles.link}>Dupe finder</Link>
            <Link href="/notes"          className={styles.link}>Browse by note</Link>
            <Link href="/best/longevity" className={styles.link}>Longest lasting</Link>
            <Link href="/best/sillage"   className={styles.link}>Beast mode</Link>
            <Link href="/best/value"     className={styles.link}>Best value</Link>
          </nav>
        </div>
        <div>
          <h3 className={styles.colTitle}>Community</h3>
          <nav className={styles.links} aria-label="Community">
            <Link href="/community" className={styles.link}>Latest takes</Link>
            <Link href="/trending"  className={styles.link}>Most discussed</Link>
            <Link href="/awards"    className={styles.link}>Monthly awards</Link>
            <Link href="/brands"    className={styles.link}>Brands</Link>
          </nav>
        </div>
        <div>
          <h3 className={styles.colTitle}>Perfy</h3>
          <nav className={styles.links} aria-label="About">
            <Link href="/about"               className={styles.link}>About</Link>
            <Link href="/privacy"             className={styles.link}>Privacy</Link>
            <Link href="/terms"               className={styles.link}>Terms</Link>
            <Link href="/affiliate-disclosure" className={styles.link}>Affiliate disclosure</Link>
          </nav>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2026 Perfy. Purchase links may earn commission.</span>
        <span>Made for fragrance lovers</span>
      </div>
    </footer>
  )
}
