import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'About Perfy',
  description: 'Perfy is the community fragrance database — honest ratings on longevity, sillage and value, powered by real Reddit reviews and community votes.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <h1 className={styles.title}>About Perfy</h1>

        <p>
          Perfy is a community fragrance database built for one thing: helping you find
          scents you&rsquo;ll actually love, using honest signals instead of marketing copy.
        </p>

        <h2>How our ratings work</h2>
        <p>
          Every fragrance page shows community ratings for <strong>longevity</strong> (how long it
          lasts), <strong>sillage</strong> (how far it projects), <strong>gender lean</strong>, and{' '}
          <strong>price &amp; value</strong>. Anyone can vote — no account needed. Where a fragrance
          doesn&rsquo;t yet have Perfy votes, we seed a baseline from analysis of real Reddit
          discussions on r/fragrance, r/MaleFragranceAdvice and related communities, and label it
          as such. Real votes always take over from the baseline.
        </p>

        <h2>Where the data comes from</h2>
        <ul>
          <li><strong>Reddit sentiment</strong> — we analyse public fragrance discussions to surface what the community genuinely rates, updated daily.</li>
          <li><strong>Community votes</strong> — anonymous attribute votes and classification votes (season, occasion, style) cast on Perfy itself.</li>
          <li><strong>Scent data</strong> — note pyramids, accords, and classifications compiled from public sources; where tier data is missing we estimate it from ingredient volatility and say so on the page.</li>
        </ul>

        <h2>How we make money</h2>
        <p>
          Some outbound links to retailers are affiliate links — if you buy through them we may
          earn a small commission at no extra cost to you. This never affects ratings or
          rankings, which are driven entirely by community data. See our{' '}
          <Link href="/affiliate-disclosure">affiliate disclosure</Link>.
        </p>

        <h2>Contact</h2>
        <p>
          Questions, corrections, or partnership enquiries:{' '}
          <a href="mailto:hello@perfy.io">hello@perfy.io</a>
        </p>
      </main>
      <Footer />
    </>
  )
}
