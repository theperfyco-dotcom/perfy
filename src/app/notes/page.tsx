import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getAllNotes } from '@/lib/db'
import styles from './page.module.css'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Browse Fragrances by Note',
  description: 'Explore fragrances by their notes — from bergamot and lavender to oud, vanilla and vetiver. Find every perfume featuring your favourite ingredient.',
  alternates: { canonical: '/notes' },
}

export default async function NotesIndexPage() {
  const notes = await getAllNotes()

  // Group alphabetically
  const groups = new Map<string, typeof notes>()
  for (const n of notes) {
    const letter = /^[A-Za-z]/.test(n.name) ? n.name[0].toUpperCase() : '#'
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(n)
  }
  const letters = [...groups.keys()].sort()

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Browse by <em>note</em></h1>
          <p className={styles.sub}>
            {notes.length} notes across the database — tap any ingredient to see every fragrance that features it.
          </p>
        </div>

        {letters.map(letter => (
          <section key={letter} className={styles.group} aria-label={`Notes starting with ${letter}`}>
            <h2 className={styles.letter}>{letter}</h2>
            <div className={styles.pills}>
              {groups.get(letter)!.map(n => (
                <Link
                  key={n.id}
                  href={`/note/${encodeURIComponent(n.name.toLowerCase())}`}
                  className={styles.pill}
                >
                  {n.name} <span className={styles.count}>{n.count}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  )
}
