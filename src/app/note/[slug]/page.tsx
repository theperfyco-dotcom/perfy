import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FragranceCard from '@/components/FragranceCard'
import { getFragrancesByNote } from '@/lib/db'
import styles from './page.module.css'

export const revalidate = 86400

interface Props { params: Promise<{ slug: string }> }

function titleCase(s: string) {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const name = titleCase(decodeURIComponent(slug))
  return {
    title: `${name} Fragrances — Perfumes Featuring the ${name} Note`,
    description: `Every fragrance in the Perfy database featuring ${name} — with community ratings on longevity, sillage and value, scent profiles, and where to buy in the UK.`,
    alternates: { canonical: `/note/${slug}` },
  }
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  const { note, fragrances } = await getFragrancesByNote(decoded)
  if (!note) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Fragrances with ${note.name}`,
    description: `${fragrances.length} fragrances featuring the ${note.name} note`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',  item: 'https://perfy.io' },
        { '@type': 'ListItem', position: 2, name: 'Notes', item: 'https://perfy.io/notes' },
        { '@type': 'ListItem', position: 3, name: note.name },
      ],
    },
  }

  return (
    <>
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className={styles.breadcrumbBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <Link href="/notes">Notes</Link>
          <CaretRight weight="bold" size={10} aria-hidden="true" />
          <span aria-current="page">{note.name}</span>
        </nav>
      </div>

      <main className={styles.main}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Fragrance note</p>
          <h1 className={styles.title}>{note.name} <em>fragrances</em></h1>
          <p className={styles.sub}>
            {fragrances.length} fragrance{fragrances.length === 1 ? '' : 's'} in our database
            feature {note.name.toLowerCase()} — rated by the community on longevity, sillage and value.
          </p>
        </div>

        {fragrances.length > 0 ? (
          <div className={styles.grid}>
            {fragrances.map(f => <FragranceCard key={f.id} fragrance={f} />)}
          </div>
        ) : (
          <p className={styles.empty}>No fragrances found for this note yet.</p>
        )}
      </main>
      <Footer />
    </>
  )
}
