'use client'
import { useState } from 'react'
import { Storefront, Bell, ArrowSquareOut, CheckCircle } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import type { FragrancePrice } from '@/lib/types'
import styles from './BuyPanel.module.css'

interface Props {
  prices: FragrancePrice[]
  fragranceName: string
  concentration?: string
}

export default function BuyPanel({ prices, fragranceName, concentration }: Props) {
  const { user, openAuthModal } = useAuth()

  const sizes = [...new Set(prices.map(p => p.size_ml))].sort((a, b) => a - b)
  const midSize = sizes[Math.floor(sizes.length / 2)] ?? sizes[0]

  const [selectedSize, setSelectedSize] = useState<number | null>(midSize ?? null)
  const [tracking, setTracking] = useState(false)

  const filtered = prices
    .filter(p => selectedSize === null || p.size_ml === selectedSize)
    .sort((a, b) => a.price - b.price)

  const best = filtered[0]

  function handleTrack() {
    if (!user) { openAuthModal(); return }
    setTracking(true)
  }

  if (!prices.length) {
    return (
      <aside className={styles.panel} aria-label={`Buy ${fragranceName}`}>
        <div className={styles.head}>
          <div className={styles.headTitle}>Where to buy</div>
          <p className={styles.noPrices}>No prices tracked yet — check back soon.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className={styles.panel} aria-label={`Buy ${fragranceName}`}>

      <div className={styles.head}>
        <div className={styles.headTitle}>Best price</div>
        {best && (
          <div className={styles.headPriceRow}>
            <span className={styles.headPrice}>£{best.price}</span>
            <span className={styles.headMeta}>{selectedSize}ml {concentration}</span>
          </div>
        )}
      </div>

      {sizes.length > 1 && (
        <div className={styles.sizeRow} role="group" aria-label="Select size">
          {sizes.map(s => (
            <button
              key={s}
              className={`${styles.sizeBtn}${s === selectedSize ? ` ${styles.sizeBtnActive}` : ''}`}
              onClick={() => setSelectedSize(s)}
              aria-pressed={s === selectedSize}
            >{s}ml</button>
          ))}
        </div>
      )}

      <div className={styles.retailers}>
        {filtered.map((p, i) => (
          <a
            key={p.id}
            href={p.affiliate_url}
            className={styles.retailerRow}
            rel="sponsored noopener noreferrer"
            target="_blank"
            aria-label={`Buy from ${p.retailer.name} for £${p.price}`}
          >
            <Storefront weight="bold" size={15} className={styles.retailerIcon} aria-hidden="true" />
            <div className={styles.retailerInfo}>
              <div className={styles.retailerName}>{p.retailer.name}</div>
              <div className={styles.retailerNote}>Free UK delivery</div>
            </div>
            <div className={styles.retailerRight}>
              {i === 0 && <span className={styles.bestBadge}>Best</span>}
              <span className={styles.retailerPrice}>£{p.price}</span>
              <ArrowSquareOut size={12} className={styles.extIcon} aria-hidden="true" />
            </div>
          </a>
        ))}
      </div>

      <div className={styles.foot}>
        {tracking ? (
          <div className={styles.trackingConfirm}>
            <CheckCircle weight="fill" size={14} /> Tracking price drops
          </div>
        ) : (
          <button className={styles.trackBtn} onClick={handleTrack}>
            <Bell weight="bold" size={13} /> Track price drops
          </button>
        )}
        <p className={styles.disclaimer}>
          Prices correct as of today. We earn a small commission on purchases — it keeps Perfy free.
        </p>
      </div>

    </aside>
  )
}
