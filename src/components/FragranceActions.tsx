'use client'
import { useState } from 'react'
import { Star, Heart, ListPlus, Export } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import RatingModal from './RatingModal'
import styles from './FragranceActions.module.css'

interface Props {
  fragranceId: string
  fragranceName: string
  brandName: string
}

export default function FragranceActions({ fragranceId, fragranceName, brandName }: Props) {
  const { user, openAuthModal } = useAuth()
  const [ratingOpen, setRatingOpen] = useState(false)
  const [rated, setRated] = useState(false)

  function handleRate() {
    if (!user) { openAuthModal(); return }
    setRatingOpen(true)
  }

  function handleSubmitted() {
    setRatingOpen(false)
    setRated(true)
    // Soft-reload to update community stats
    window.location.reload()
  }

  return (
    <>
      <div className={styles.actions}>
        <button
          className={`btn-primary ${rated ? styles.ratedBtn : ''}`}
          onClick={handleRate}
          aria-label="Rate this fragrance"
        >
          <Star weight={rated ? 'fill' : 'bold'} size={14} />
          {rated ? 'Rated' : 'Rate this'}
        </button>
        <button className="btn-secondary" onClick={() => !user && openAuthModal()} aria-label="Add to wishlist">
          <Heart weight="bold" size={14} /> Wishlist
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
