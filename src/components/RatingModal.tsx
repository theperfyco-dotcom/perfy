'use client'
import { useState } from 'react'
import { X, Check } from '@phosphor-icons/react'
import styles from './RatingModal.module.css'

const SCALES = {
  longevity: {
    label: 'Longevity',
    sub: 'How long does it last on skin?',
    options: ['Barely there', 'Weak', 'Moderate', 'Long-lasting', 'Eternal'],
  },
  sillage: {
    label: 'Sillage',
    sub: 'How far does the scent project?',
    options: ['Skin scent', 'Close', 'Moderate', 'Strong', 'Beast mode'],
  },
  gender: {
    label: 'Gender',
    sub: 'Who does this fragrance skew toward?',
    options: ['All female', 'Mostly female', 'Unisex', 'Mostly male', 'All male'],
  },
  price_value: {
    label: 'Price & Value',
    sub: 'Is it worth the money?',
    options: ['Way overpriced', 'Overpriced', 'Fair price', 'Good value', 'Great value'],
  },
} as const

type ScaleKey = keyof typeof SCALES

const SCORE_LABELS: Record<number, string> = {
  1: 'Avoid', 2: 'Poor', 3: 'Below average', 4: 'Average',
  5: 'Decent', 6: 'Good', 7: 'Very good', 8: 'Excellent', 9: 'Outstanding', 10: 'Masterpiece',
}

interface Props {
  fragranceId: string
  fragranceName: string
  brandName: string
  onClose: () => void
  onSubmitted: () => void
}

export default function RatingModal({ fragranceId, fragranceName, brandName, onClose, onSubmitted }: Props) {
  const [score,       setScore]       = useState<number | null>(null)
  const [longevity,   setLongevity]   = useState<number | null>(null)
  const [sillage,     setSillage]     = useState<number | null>(null)
  const [gender,      setGender]      = useState<number | null>(null)
  const [price_value, setPriceValue]  = useState<number | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [done,        setDone]        = useState(false)

  const setters: Record<ScaleKey, (v: number | null) => void> = {
    longevity:   setLongevity,
    sillage:     setSillage,
    gender:      setGender,
    price_value: setPriceValue,
  }
  const values: Record<ScaleKey, number | null> = {
    longevity, sillage, gender, price_value,
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!score) { setError('Please give an overall score.'); return }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fragrance_id: fragranceId,
        score,
        longevity_v2:  longevity,
        sillage_v2:    sillage,
        gender_rating: gender,
        price_value,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong.')
      return
    }
    setDone(true)
    setTimeout(onSubmitted, 1400)
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Rate fragrance"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.panel}>
        <button className={styles.close} aria-label="Close" onClick={onClose}>
          <X weight="bold" size={16} />
        </button>

        {done ? (
          <div className={styles.done}>
            <div className={styles.doneCheck}><Check weight="bold" size={32} /></div>
            <p className={styles.doneTitle}>Rating saved</p>
            <p className={styles.doneSub}>Thanks for rating {fragranceName}</p>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Rate this fragrance</h2>
              <p className={styles.sub}>{fragranceName} <span className={styles.subBrand}>by {brandName}</span></p>
            </div>

            <form onSubmit={submit} className={styles.form}>

              {/* Overall score */}
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <span className={styles.sectionLabel}>Overall score <span className={styles.required}>*</span></span>
                  {score && <span className={styles.sectionValue}>{score}/10 — {SCORE_LABELS[score]}</span>}
                </div>
                <div className={styles.scoreRow}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.scoreBtn} ${score === n ? styles.scoreBtnOn : ''}`}
                      onClick={() => setScore(prev => prev === n ? null : n)}
                      aria-pressed={score === n}
                      aria-label={`Score ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5-point scales */}
              {(Object.entries(SCALES) as [ScaleKey, typeof SCALES[ScaleKey]][]).map(([key, cfg]) => {
                const val = values[key]
                return (
                  <div key={key} className={styles.section}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionLabel}>{cfg.label}</span>
                      {val && <span className={styles.sectionValue}>{cfg.options[val - 1]}</span>}
                    </div>
                    <p className={styles.sectionSub}>{cfg.sub}</p>
                    <div className={styles.scaleRow}>
                      {cfg.options.map((opt, i) => {
                        const idx = i + 1
                        const active = val === idx
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`${styles.scaleBtn} ${active ? styles.scaleBtnOn : ''}`}
                            onClick={() => setters[key](val === idx ? null : idx)}
                            aria-pressed={active}
                          >
                            <span className={styles.scaleBtnIdx}>{idx}</span>
                            <span className={styles.scaleBtnLabel}>{opt}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={`btn-primary ${styles.submit}`}
                disabled={loading || !score}
              >
                {loading ? 'Saving…' : 'Submit rating'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
