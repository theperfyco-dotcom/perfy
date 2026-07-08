import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms that apply when you use Perfy.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <h1 className={styles.title}>Terms of use</h1>
        <p className={styles.updated}>Last updated: July 2026</p>

        <h2>Using Perfy</h2>
        <p>
          Perfy is a free fragrance-discovery service. By using it you agree to these terms. Use
          it lawfully and don&rsquo;t attempt to disrupt the service, scrape it at abusive rates,
          or manipulate community votes.
        </p>

        <h2>Community content</h2>
        <p>
          Votes and statements you submit may be displayed publicly and used to compute aggregate
          scores. Don&rsquo;t post anything unlawful, defamatory, or promotional. We may remove
          content that manipulates ratings or breaks these rules.
        </p>

        <h2>Ratings &amp; data</h2>
        <p>
          Scores, sentiment analysis and dupe matches are community- and data-driven signals, not
          professional advice. Fragrance performance varies by skin, climate and batch. Prices
          shown may change — always check the retailer&rsquo;s final price.
        </p>

        <h2>Affiliate links</h2>
        <p>
          Outbound retailer links may earn us commission. Purchases are contracts between you and
          the retailer — we are not a party to the sale.
        </p>

        <h2>Liability</h2>
        <p>
          Perfy is provided &ldquo;as is&rdquo; without warranties. To the maximum extent permitted
          by law, we are not liable for losses arising from use of the site or from purchases made
          via linked retailers.
        </p>

        <h2>Contact</h2>
        <p><a href="mailto:hello@perfy.io">hello@perfy.io</a></p>
      </main>
      <Footer />
    </>
  )
}
