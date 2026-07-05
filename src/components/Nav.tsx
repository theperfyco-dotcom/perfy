'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MagnifyingGlass, Heart, User, SignOut } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import styles from './Nav.module.css'

const NAV_LINKS = [
  { href: '/new',       label: 'New' },
  { href: '/trending',  label: 'Trending' },
  { href: '/brands',    label: 'Brands' },
  { href: '/dupes',     label: 'Dupes' },
  { href: '/discover',  label: 'Discover' },
  { href: '/community', label: 'Community' },
]

export default function Nav() {
  const path    = usePathname()
  const router  = useRouter()
  const { user, openAuthModal, signOut } = useAuth()

  return (
    <>
      <div className={styles.announce}>
        Free UK shipping on orders over £30 —{' '}
        <Link href="/join">Join 180,000 members</Link> rating fragrances right now
      </div>

      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            Perf<em>y</em>
          </Link>

          <div className={styles.cats}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`${styles.cat} ${path.startsWith(href) ? styles.active : ''}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="Search" onClick={() => router.push('/discover')}>
              <MagnifyingGlass weight="bold" size={18} />
            </button>
            <button className={styles.iconBtn} aria-label="Wishlist">
              <Heart weight="bold" size={18} />
            </button>
            {user ? (
              <>
                <Link href="/profile" className={styles.avatar} aria-label="My profile" title={user.email ?? 'Profile'}>
                  {user.email?.[0].toUpperCase()}
                </Link>
                <button className={styles.iconBtn} aria-label="Sign out" onClick={signOut} title="Sign out">
                  <SignOut weight="bold" size={18} />
                </button>
              </>
            ) : (
              <>
                <button className={styles.iconBtn} aria-label="Sign in" onClick={openAuthModal}>
                  <User weight="bold" size={18} />
                </button>
                <button className={styles.joinBtn} onClick={openAuthModal}>Join free</button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
