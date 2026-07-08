'use client'
import Link from 'next/link'
import { Heart, ShoppingBag } from '@phosphor-icons/react'
import { Fragrance } from '@/lib/types'
import { getAccordColor } from '@/lib/accord-colors'
import styles from './PaletteRow.module.css'

interface Props {
  fragrance: Fragrance
  rank: number
  /** Override score display, e.g. a Reddit-derived score when no Perfy ratings exist */
  score?: number | null
  countText?: string
}

export default function PaletteRow({ fragrance, rank, score, countText }: Props) {
  const { slug, name, brand, accords = [], avg_score, rating_count } = fragrance
  const shownScore = avg_score ?? score
  const shownCount = countText ?? (rating_count != null ? `${rating_count.toLocaleString()} ratings` : null)
  const total = accords.reduce((s, a) => s + a.percentage, 0)

  return (
    <Link
      href={`/fragrance/${slug}`}
      className={styles.row}
      role="listitem"
      aria-label={`${name} by ${brand.name}${accords.length ? ` — ${accords.map(a => a.name).join(', ')}` : ''}${shownScore ? ` — ${shownScore.toFixed(1)}/10` : ''}`}
    >
      <span className={styles.pos}>{rank}</span>

      <div className={styles.swatches} aria-hidden="true">
        {accords.map((accord) => (
          <div
            key={accord.name}
            className={styles.swatch}
            style={{ background: accord.color_hex ?? getAccordColor(accord.name), flex: accord.percentage / total }}
          >
            <span className={styles.swatchLabel}>{accord.name}</span>
          </div>
        ))}
      </div>

      <div className={styles.info}>
        <span className={styles.fragName}>{name}</span>
        <span className={styles.fragBrand}>{brand.name}</span>
        {(shownScore || shownCount) && (
          <div className={styles.scoreRow}>
            {shownScore && <span className={styles.score}>{shownScore.toFixed(1)}</span>}
            {shownCount && <span className={styles.count}>{shownCount}</span>}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          aria-label={`Wishlist ${name}`}
          onClick={e => e.preventDefault()}
        >
          <Heart weight="bold" size={14} />
        </button>
        <button
          className={styles.actionBtn}
          aria-label={`Buy ${name}`}
          onClick={e => e.preventDefault()}
        >
          <ShoppingBag weight="bold" size={14} />
        </button>
      </div>
    </Link>
  )
}
