'use client'
import { useState } from 'react'
import { Storefront, Bell, ArrowSquareOut, CheckCircle } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import type { FragrancePrice } from '@/lib/types'
import styles from './BuyPanel.module.css'

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? ''

function amazonSearchUrl(brand: string, name: string, concentration?: string) {
  const q = [brand, name, concentration].filter(Boolean).join(' ')
  return `https://www.amazon.co.uk/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`
}

interface Props {
  prices: FragrancePrice[]
  fragranceName: string
  brandName: string
  concentration?: string
}

export default function BuyPanel({ prices, fragranceName, brandName, concentration }: Props) {
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

  const amazonUrl = amazonSearchUrl(brandName, fragranceName, concentration)

  if (!prices.length) {
    return (
      <aside className={styles.panel} aria-label={`Buy ${fragranceName}`}>
        <div className={styles.head}>
          <div className={styles.headTitle}>Where to buy</div>
          <p className={styles.noPrices}>Price tracking coming soon</p>
        </div>
        <div className={styles.retailers}>
          <a
            href={amazonUrl}
            className={styles.retailerRow}
            rel="sponsored noopener noreferrer"
            target="_blank"
            aria-label={`Search for ${fragranceName} on Amazon`}
          >
            <Storefront weight="bold" size={15} className={styles.retailerIcon} aria-hidden="true" />
            <div className={styles.retailerInfo}>
              <div className={styles.retailerName}>Amazon</div>
              <div className={styles.retailerNote}>Search all sizes &amp; sellers</div>
            </div>
            <div className={styles.retailerRight}>
              <ArrowSquareOut size={12} className={styles.extIcon} aria-hidden="true" />
            </div>
          </a>
        </div>
        <div className={styles.foot}>
          <p className={styles.disclaimer}>
            We earn a small commission on Amazon purchases — it keeps Perfy free.
          </p>
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
        {filtered.map((p, i) => {
          const href = p.affiliate_url && p.affiliate_url !== '#'
            ? p.affiliate_url
            : amazonUrl
          return (
            <a
              key={p.id}
              href={href}
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
          )
        })}
        {/* Amazon as additional option */}
        <a
          href={amazonUrl}
          className={`${styles.retailerRow} ${styles.amazonRow}`}
          rel="sponsored noopener noreferrer"
          target="_blank"
          aria-label={`Search Amazon for ${fragranceName}`}
        >
          <Storefront weight="bold" size={15} className={styles.retailerIcon} aria-hidden="true" />
          <div className={styles.retailerInfo}>
            <div className={styles.retailerName}>Amazon</div>
            <div className={styles.retailerNote}>More sizes &amp; sellers</div>
          </div>
          <div className={styles.retailerRight}>
            <ArrowSquareOut size={12} className={styles.extIcon} aria-hidden="true" />
          </div>
        </a>
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
