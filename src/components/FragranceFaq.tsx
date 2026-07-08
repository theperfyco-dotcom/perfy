import Link from 'next/link'
import type { PerfStats } from '@/lib/db'
import type { Fragrance } from '@/lib/types'
import styles from './FragranceFaq.module.css'

// Q&A content generated from the community data each fragrance page already
// loads. Written in the same phrasing people type into Google and LLMs, with
// FAQPage structured data. Answers only render when real data backs them.

const LONGEVITY_LABELS = ['barely there', 'weak', 'moderate', 'long-lasting', 'eternal']
const SILLAGE_LABELS   = ['a skin scent', 'close to the skin', 'moderate', 'strong', 'beast mode']
const GENDER_LABELS    = ['strongly feminine', 'mostly feminine', 'unisex', 'mostly masculine', 'strongly masculine']
const VALUE_LABELS     = ['way overpriced', 'overpriced', 'fairly priced', 'good value', 'great value']

interface Dist { peakIdx: number; peakPct: number; secondIdx: number; secondPct: number; total: number }

function analyse(counts: number[]): Dist | null {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total < 5) return null
  const idx = counts.map((c, i) => ({ c, i })).sort((a, b) => b.c - a.c)
  return {
    peakIdx:   idx[0].i,
    peakPct:   Math.round((idx[0].c / total) * 100),
    secondIdx: idx[1].i,
    secondPct: Math.round((idx[1].c / total) * 100),
    total,
  }
}

interface Faq { q: string; a: string; links?: Array<{ label: string; href: string }> }

interface Props {
  fragrance:  Fragrance
  perfStats:  PerfStats
  noteTiers:  { top: Array<{ name: string }>; heart: Array<{ name: string }>; base: Array<{ name: string }> } | null
  accords:    Array<{ name: string }>
  dupes:      Array<{ slug: string; name: string; brand: { name: string }; similarity: number }>
}

export default function FragranceFaq({ fragrance, perfStats, noteTiers, accords, dupes }: Props) {
  const name  = fragrance.name
  const brand = fragrance.brand.name
  const faqs: Faq[] = []

  // What does it smell like?
  {
    const listOf = (notes: Array<{ name: string }>) => notes.slice(0, 3).map(n => n.name.toLowerCase()).join(', ')
    let s1 = fragrance.fw_classification
      ? `${name} by ${brand} is a ${fragrance.fw_classification.toLowerCase()} fragrance`
      : `${name} is a fragrance by ${brand}`
    if (accords.length > 0) s1 += `, dominated by ${accords.slice(0, 3).map(a => a.name.toLowerCase()).join(', ')} accords`
    s1 += '.'

    let s2 = ''
    if (noteTiers?.top.length) {
      s2 = ` It opens with ${listOf(noteTiers.top)}`
      if (noteTiers.base.length) s2 += `, settling into a base of ${listOf(noteTiers.base)}`
      s2 += '.'
    } else if (noteTiers?.base.length) {
      s2 = ` Its base is built on ${listOf(noteTiers.base)}.`
    }

    if (accords.length > 0 || s2) {
      faqs.push({ q: `What does ${name} smell like?`, a: s1 + s2 })
    }
  }

  // Longevity
  const lon = analyse(perfStats.longevity)
  if (lon) {
    let a = `Based on ${lon.total} community ratings, ${lon.peakPct}% describe the longevity of ${name} as ${LONGEVITY_LABELS[lon.peakIdx]}`
    if (lon.secondPct >= 20) a += `, while ${lon.secondPct}% say it is ${LONGEVITY_LABELS[lon.secondIdx]}`
    a += '. Longevity varies with skin chemistry, climate and how much you apply.'
    faqs.push({ q: `How long does ${name} last?`, a })
  }

  // Sillage
  const sil = analyse(perfStats.sillage)
  if (sil) {
    let a = `${sil.peakPct}% of community votes rate the sillage of ${name} as ${SILLAGE_LABELS[sil.peakIdx]}`
    if (sil.secondPct >= 20) a += `, with another ${sil.secondPct}% calling it ${SILLAGE_LABELS[sil.secondIdx]}`
    a += '.'
    faqs.push({ q: `How strong is the sillage of ${name}?`, a })
  }

  // Gender
  const gen = analyse(perfStats.gender)
  if (gen) {
    const a = `The community rates ${name} as ${GENDER_LABELS[gen.peakIdx]} (${gen.peakPct}% of votes)` +
      (gen.secondPct >= 20 ? `, though ${gen.secondPct}% consider it ${GENDER_LABELS[gen.secondIdx]}` : '') +
      '. Fragrance has no rules — wear what you love.'
    faqs.push({ q: `Is ${name} masculine or feminine?`, a })
  }

  // Value
  const val = analyse(perfStats.price_value)
  if (val) {
    const a = `${val.peakPct}% of community votes rate ${name} as ${VALUE_LABELS[val.peakIdx]}` +
      (val.secondPct >= 20 ? `, while ${val.secondPct}% say it is ${VALUE_LABELS[val.secondIdx]}` : '') +
      '.'
    faqs.push({ q: `Is ${name} worth the money?`, a })
  }

  // Dupes
  if (dupes.length >= 2) {
    const top = dupes.slice(0, 3)
    faqs.push({
      q: `What smells similar to ${name}?`,
      a: `The closest matches by accord profile are ${top.map(d => `${d.name} by ${d.brand.name} (${d.similarity}% match)`).join(', ')}.`,
      links: [{ label: `See all ${name} dupes`, href: `/dupes/${fragrance.slug}` }],
    })
  }

  if (faqs.length < 2) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <section className={styles.section} aria-labelledby="faq-heading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className={styles.heading} id="faq-heading">Questions &amp; <em>answers</em></h2>
      <p className={styles.sub}>Answers generated from community ratings and scent data — updated as votes come in.</p>
      <div className={styles.list}>
        {faqs.map((f, i) => (
          <details key={f.q} className={styles.item} open={i === 0}>
            <summary className={styles.question}>{f.q}</summary>
            <div className={styles.answer}>
              <p>{f.a}</p>
              {f.links?.map(l => (
                <Link key={l.href} href={l.href} className={styles.link}>{l.label} →</Link>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
