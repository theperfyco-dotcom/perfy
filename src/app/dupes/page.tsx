import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from '../coming-soon.module.css'

export const metadata: Metadata = {
  title: 'Dupe Finder',
  description: 'Find cheaper fragrance alternatives that smell almost identical.',
}

export default function DupesPage() {
  return (
    <div className={styles.wrap}>
      <Nav />
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Coming soon</p>
          <h1 className={styles.heading}>Dupe Finder</h1>
          <p className={styles.sub}>
            We&rsquo;re building community-powered fragrance matching. Find cheaper
            alternatives that smell almost identical.
          </p>
          <form className={styles.form}>
            <input
              type="email"
              placeholder="Enter your email to be notified"
              className={styles.input}
              aria-label="Email address"
            />
            <button type="submit" className="btn-primary">Notify me</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
