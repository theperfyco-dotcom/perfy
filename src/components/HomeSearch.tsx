'use client'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState } from 'react'
import styles from './HomeSearch.module.css'

export default function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/discover?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form className={styles.wrap} onSubmit={submit} role="search">
      <div className={styles.icon} aria-hidden="true">
        <MagnifyingGlass weight="bold" size={16} />
      </div>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search 50,000+ fragrances…"
        aria-label="Search fragrances"
        className={styles.input}
      />
      <button type="submit" className={styles.btn}>Search</button>
    </form>
  )
}
