'use client'
import Link from 'next/link'
import { Heart, ShoppingBag } from '@phosphor-icons/react'
import { Fragrance } from '@/lib/types'
import { getAccordColor } from '@/lib/accord-colors'
import styles from './PaletteRow.module.css'

interface Props {
  fragrance: Fragrance
  rank: number
}

export default function PaletteRow({ fragrance, rank }: Props) {
  const { slug, name, brand, accords = [], avg_score, rating_count } = fragrance
  const total = accords.reduce((s, a) => s + a.percentage, 0)

  return (
    <Link
      href={`/fragrance/${slug}`}
      className={styles.row}
      role="listitem"
      aria-label={`${name} by ${brand.name} — ${accords.map(a => a.name).join(', ')} — ${avg_score}`}
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
        <div className={styles.scoreRow}>
          <span className={styles.score}>{avg_score?.toFixed(1)}</span>
          <span className={styles.count}>{rating_count?.toLocaleString()} ratings</span>
        </div>
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
