import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'How Perfy earns commission from retailer links, and why it never affects our community ratings.',
  alternates: { canonical: '/affiliate-disclosure' },
}

export default function AffiliateDisclosurePage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <h1 className={styles.title}>Affiliate disclosure</h1>
        <p className={styles.updated}>Last updated: July 2026</p>

        <p>
          Perfy is free to use. To keep it that way, some links to retailers on this site are{' '}
          <strong>affiliate links</strong> — if you click one and make a purchase, we may earn a
          small commission from the retailer. You never pay more by using our links.
        </p>

        <h2>Which links are affiliated</h2>
        <ul>
          <li>&ldquo;Where to buy&rdquo; links on fragrance pages, including Amazon</li>
          <li>Retailer price-comparison links in the buy panel</li>
        </ul>
        <p>
          As an Amazon Associate, Perfy earns from qualifying purchases. All affiliate links carry
          a <code>rel=&quot;sponsored&quot;</code> attribute in line with search-engine guidelines.
        </p>

        <h2>What affiliate money never touches</h2>
        <p>
          Community ratings, Reddit sentiment scores, dupe-similarity results and trending
          rankings are computed from data alone. Retailers cannot pay to change a score, a
          ranking, or a dupe match — there is no mechanism for it.
        </p>
      </main>
      <Footer />
    </>
  )
}
