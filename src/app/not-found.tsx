import Link from 'next/link'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <Nav />
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.code}>404</p>
          <h1 className={styles.heading}>Page not found</h1>
          <p className={styles.sub}>
            The fragrance you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
          </p>
          <Link href="/discover" className="btn-primary">
            Browse fragrances
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
