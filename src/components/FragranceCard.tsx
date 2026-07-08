'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Tree, Waves, MoonStars, FlowerLotus } from '@phosphor-icons/react'
import { Fragrance } from '@/lib/types'
import AccordStrip from './AccordStrip'
import styles from './FragranceCard.module.css'

const PLACEHOLDER_ICONS: Record<string, React.ReactNode> = {
  masculine: <Tree weight="fill" size={48} />,
  feminine:  <FlowerLotus weight="fill" size={48} />,
  unisex:    <MoonStars weight="fill" size={48} />,
}

interface Props {
  fragrance: Fragrance
  rank?: number
  redditScore?: number | null
  redditMentions?: number
}

export default function FragranceCard({ fragrance, rank, redditScore, redditMentions }: Props) {
  const { slug, name, brand, accords = [], avg_score, rating_count, image_url } = fragrance

  return (
    <article className={styles.card} aria-label={`${name} by ${brand.name}`}>

      {/* Image */}
      <Link href={`/fragrance/${slug}`} className={styles.imgLink} tabIndex={-1} aria-hidden="true">
        <div className={styles.img} style={image_url ? undefined : { background: 'linear-gradient(160deg, #EBF5EE, #D0E8D8)' }}>
          {image_url ? (
            <Image
              src={image_url}
              alt={`${name} by ${brand.name}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
              className={styles.imgPhoto}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span className={styles.imgIcon} aria-hidden="true">
              {PLACEHOLDER_ICONS[fragrance.gender ?? 'unisex'] ?? <Waves weight="fill" size={48} />}
            </span>
          )}
          {rank && <span className={styles.rank} aria-label={`Ranked #${rank}`}>#{rank}</span>}
          <button
            className={styles.wishBtn}
            aria-label={`Add ${name} to wishlist`}
            onClick={e => e.preventDefault()}
          >
            <Heart weight="bold" size={13} />
          </button>
        </div>
      </Link>

      {/* Accord colour bar — visual fingerprint of the scent */}
      {accords.length > 0 && <AccordStrip accords={accords} height={6} gap={0} />}

      {/* Card body */}
      <div className={styles.body}>
        <p className={styles.brand}>{brand.name}</p>
        <h3 className={styles.name}>
          <Link href={`/fragrance/${slug}`}>{name}</Link>
        </h3>

        {/* Community score — Perfy ratings first, Reddit sentiment as fallback */}
        {avg_score ? (
          <div className={styles.scoreRow}>
            <span className={styles.scoreBadge} aria-label={`${avg_score.toFixed(1)} out of 10`}>
              {avg_score.toFixed(1)}
            </span>
            <div className={styles.scoreMeta}>
              <span className={styles.scoreLabel}>/10</span>
              {rating_count != null && (
                <span className={styles.ratingCount}>{rating_count.toLocaleString()} ratings</span>
              )}
            </div>
          </div>
        ) : redditScore ? (
          <div className={styles.scoreRow}>
            <span className={styles.scoreBadge} aria-label={`${redditScore.toFixed(1)} out of 10 from Reddit reviews`}>
              {redditScore.toFixed(1)}
            </span>
            <div className={styles.scoreMeta}>
              <span className={styles.scoreLabel}>/10</span>
              <span className={styles.ratingCount}>
                {redditMentions ? `${redditMentions} Reddit reviews` : 'Reddit reviews'}
              </span>
            </div>
          </div>
        ) : (
          <p className={styles.noScore}>Not yet rated</p>
        )}

        {/* Top accord labels */}
        {accords.length > 0 && (
          <div className={styles.accordLabels} aria-label="Main accords">
            {accords.slice(0, 3).map(a => (
              <span key={a.name} className={styles.accordLabel}>{a.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer — metadata only, no buy CTA */}
      <div className={styles.footer}>
        <span className={styles.footMeta}>
          {[fragrance.concentration, fragrance.year].filter(Boolean).join(' · ')}
        </span>
        <Link href={`/fragrance/${slug}`} className={styles.detailLink} aria-label={`View ${name} details`}>
          View →
        </Link>
      </div>

    </article>
  )
}
