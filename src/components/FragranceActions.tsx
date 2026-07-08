'use client'
import { useState, useEffect } from 'react'
import { Star, Heart, CheckCircle, ListPlus, Export } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import RatingModal from './RatingModal'
import styles from './FragranceActions.module.css'

interface Props {
  fragranceId: string
  fragranceName: string
  brandName: string
  variant?: 'default' | 'cta'
}

function ownedStorageKey(fragranceId: string) {
  return `collection_${fragranceId}`
}

function readOwned(fragranceId: string): boolean {
  try {
    const raw = localStorage.getItem(ownedStorageKey(fragranceId))
    return raw ? (JSON.parse(raw) as string[]).includes('owned') : false
  } catch { return false }
}

function writeOwned(fragranceId: string, owned: boolean) {
  try {
    const raw = localStorage.getItem(ownedStorageKey(fragranceId))
    const set = new Set(raw ? (JSON.parse(raw) as string[]) : [])
    if (owned) set.add('owned'); else set.delete('owned')
    localStorage.setItem(ownedStorageKey(fragranceId), JSON.stringify([...set]))
  } catch { /* noop */ }
}

export default function FragranceActions({ fragranceId, fragranceName, brandName, variant = 'default' }: Props) {
  const { user, openAuthModal } = useAuth()
  const [ratingOpen,  setRatingOpen]  = useState(false)
  const [rated,       setRated]       = useState(false)
  const [wishlisted,  setWishlisted]  = useState(false)
  const [wishLoading, setWishLoading] = useState(false)
  const [owned,       setOwned]       = useState(false)

  useEffect(() => {
    setOwned(readOwned(fragranceId))
    if (!user) return
    fetch(`/api/wishlist?fragrance_id=${fragranceId}`)
      .then(r => r.json())
      .then(d => setWishlisted(d.wishlisted))
      .catch(() => {})
  }, [user, fragranceId])

  function handleRate() {
    if (!user) { openAuthModal(); return }
    setRatingOpen(true)
  }

  async function handleWishlist() {
    if (!user) { openAuthModal(); return }
    setWishLoading(true)
    const method = wishlisted ? 'DELETE' : 'POST'
    const res = await fetch('/api/wishlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragrance_id: fragranceId }),
    })
    if (res.ok) {
      const d = await res.json()
      setWishlisted(d.wishlisted)
    }
    setWishLoading(false)
  }

  function handleOwned() {
    const next = !owned
    setOwned(next)
    writeOwned(fragranceId, next)
    if (next) {
      fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragrance_id: fragranceId, status: 'owned' }),
      }).catch(() => {})
    } else {
      fetch('/api/collection?' + new URLSearchParams({ fragrance_id: fragranceId, status: 'owned' }), { method: 'DELETE' }).catch(() => {})
    }
  }

  function handleSubmitted() {
    setRatingOpen(false)
    setRated(true)
    window.location.reload()
  }

  return (
    <>
      <div className={`${styles.actions} ${variant === 'cta' ? styles.actionsCta : ''}`}>
        <button
          className={`btn-primary ${rated ? styles.ratedBtn : ''} ${variant === 'cta' ? styles.ctaRateBtn : ''}`}
          onClick={handleRate}
          aria-label="Rate this fragrance"
        >
          <Star weight={rated ? 'fill' : 'bold'} size={14} />
          {rated ? 'Rated' : 'Rate this fragrance'}
        </button>
        <button
          className={`btn-secondary ${wishlisted ? styles.activeBtn : ''}`}
          onClick={handleWishlist}
          disabled={wishLoading}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          <Heart weight={wishlisted ? 'fill' : 'bold'} size={14} />
          {wishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>
        <button
          className={`btn-secondary ${owned ? styles.activeBtn : ''}`}
          onClick={handleOwned}
          aria-label={owned ? 'Remove from collection' : 'I own this fragrance'}
          aria-pressed={owned}
        >
          <CheckCircle weight={owned ? 'fill' : 'bold'} size={14} />
          {owned ? 'Owned' : 'I own it'}
        </button>
        <button className={styles.iconOnly} onClick={() => !user && openAuthModal()} aria-label="Add to list" title="Add to list">
          <ListPlus weight="bold" size={18} />
        </button>
        <button className={styles.iconOnly} aria-label="Share" title="Share" onClick={handleShare}>
          <Export weight="bold" size={18} />
        </button>
      </div>

      {ratingOpen && (
        <RatingModal
          fragranceId={fragranceId}
          fragranceName={fragranceName}
          brandName={brandName}
          onClose={() => setRatingOpen(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </>
  )
}

function handleShare() {
  if (navigator.share) {
    navigator.share({ url: window.location.href }).catch(() => {})
  } else {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }
}
