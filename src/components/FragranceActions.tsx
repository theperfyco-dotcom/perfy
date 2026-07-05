'use client'
import { useState, useEffect } from 'react'
import { Star, Heart, ListPlus, Export } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import RatingModal from './RatingModal'
import styles from './FragranceActions.module.css'

interface Props {
  fragranceId: string
  fragranceName: string
  brandName: string
  variant?: 'default' | 'cta'
}

export default function FragranceActions({ fragranceId, fragranceName, brandName, variant = 'default' }: Props) {
  const { user, openAuthModal } = useAuth()
  const [ratingOpen,  setRatingOpen]  = useState(false)
  const [rated,       setRated]       = useState(false)
  const [wishlisted,  setWishlisted]  = useState(false)
  const [wishLoading, setWishLoading] = useState(false)

  useEffect(() => {
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
          className={`btn-secondary ${wishlisted ? styles.wishlistedBtn : ''}`}
          onClick={handleWishlist}
          disabled={wishLoading}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          <Heart weight={wishlisted ? 'fill' : 'bold'} size={14} />
          {wishlisted ? 'Wishlisted' : 'Wishlist'}
        </button>
        <button className="btn-secondary" onClick={() => !user && openAuthModal()} aria-label="Add to list">
          <ListPlus weight="bold" size={14} /> Add to list
        </button>
        <button className={styles.iconOnly} aria-label="Share" onClick={handleShare}>
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
