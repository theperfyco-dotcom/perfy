import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Perfy handles your data: what we collect, what we never collect, and your rights.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <h1 className={styles.title}>Privacy policy</h1>
        <p className={styles.updated}>Last updated: July 2026</p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Anonymous voting</strong> — attribute and classification votes are stored against a random session identifier kept in your browser&rsquo;s local storage. It is not linked to your identity.</li>
          <li><strong>Accounts (optional)</strong> — if you create an account we store your email address and the ratings, wishlist and collection entries you make.</li>
          <li><strong>Community statements</strong> — text you submit is public and stored without identity unless you are signed in.</li>
        </ul>

        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>We don&rsquo;t sell your data.</li>
          <li>We don&rsquo;t show third-party advertising.</li>
          <li>We don&rsquo;t track you across other websites.</li>
        </ul>

        <h2>Affiliate links</h2>
        <p>
          When you click a retailer link, the retailer or affiliate network may set cookies to
          attribute the sale. That happens on their site under their privacy policy.
        </p>

        <h2>Infrastructure</h2>
        <p>
          Perfy runs on Vercel (hosting) and Supabase (database). Both process data on our behalf
          under their own security and privacy terms.
        </p>

        <h2>Your rights</h2>
        <p>
          Under UK GDPR you can request access to, correction of, or deletion of your personal
          data at any time: <a href="mailto:hello@perfy.io">hello@perfy.io</a>
        </p>
      </main>
      <Footer />
    </>
  )
}
