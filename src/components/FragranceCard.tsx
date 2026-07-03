'use client'
import Link from 'next/link'
import { ShoppingBag, Heart, Tree, Waves, MoonStars, FlowerLotus } from '@phosphor-icons/react'
import { Fragrance } from '@/lib/types'
import AccordStrip from './AccordStrip'
import styles from './FragranceCard.module.css'

const PLACEHOLDER_ICONS: Record<string, React.ReactNode> = {
  masculine: <Tree weight="fill" size={56} />,
  feminine:  <FlowerLotus weight="fill" size={56} />,
  unisex:    <MoonStars weight="fill" size={56} />,
}

interface Props {
  fragrance: Fragrance
  rank?: number
}

export default function FragranceCard({ fragrance, rank }: Props) {
  const { slug, name, brand, accords = [], avg_score, rating_count, prices } = fragrance
  const lowestPrice = prices?.sort((a, b) => a.price - b.price)[0]

  return (
    <article className={styles.card} aria-label={`${name} by ${brand.name}`}>
      <Link href={`/fragrance/${slug}`} className={styles.imgLink}>
        <div className={styles.img} style={{ background: 'linear-gradient(160deg, #EBF5EE, #D0E8D8)' }}>
          <span className={styles.imgIcon} aria-hidden="true">
            {PLACEHOLDER_ICONS[fragrance.gender ?? 'unisex'] ?? <Waves weight="fill" size={56} />}
          </span>
          {rank && <span className={styles.rank}>#{rank}</span>}
          <button className={styles.wishBtn} aria-label={`Add ${name} to wishlist`} onClick={e => e.preventDefault()}>
            <Heart weight="bold" size={14} />
          </button>
        </div>
      </Link>

      {accords.length > 0 && (
        <AccordStrip accords={accords} height={4} gap={1} />
      )}

      <div className={styles.body}>
        <div className={styles.brand}>{brand.name}</div>
        <h3 className={styles.name}>
          <Link href={`/fragrance/${slug}`}>{name}</Link>
        </h3>

        {avg_score && (
          <div className={styles.scoreRow}>
            <span className={styles.score}>{avg_score.toFixed(1)}</span>
            <span className={styles.scoreMeta}>{rating_count?.toLocaleString()} ratings</span>
          </div>
        )}

        {accords.length > 0 && (
          <div className={styles.accordLabels}>
            {accords.slice(0, 3).map(a => (
              <span key={a.name} className={styles.accordLabel}>{a.name}</span>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <div>
            {lowestPrice && (
              <>
                <div className={styles.price}>£{lowestPrice.price}</div>
                <div className={styles.priceSub}>{lowestPrice.size_ml}ml {fragrance.concentration}</div>
              </>
            )}
          </div>
          <Link href={`/fragrance/${slug}#buy`} className={styles.buyBtn}>
            <ShoppingBag weight="bold" size={12} /> Buy
          </Link>
        </div>
      </div>
    </article>
  )
}
