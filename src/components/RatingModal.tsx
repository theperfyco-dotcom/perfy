'use client'
import { useState } from 'react'
import { X, Check } from '@phosphor-icons/react'
import styles from './RatingModal.module.css'

const LONGEVITY = [
  { value: 'under-4hrs', label: 'Under 4 hrs' },
  { value: '4-8hrs',     label: '4–8 hrs' },
  { value: '8-12hrs',    label: '8–12 hrs' },
  { value: '12-24hrs',   label: '12–24 hrs' },
  { value: '24hrs+',     label: '24 hrs+' },
]
const SILLAGE = [
  { value: 'intimate',  label: 'Intimate' },
  { value: 'soft',      label: 'Soft' },
  { value: 'moderate',  label: 'Moderate' },
  { value: 'strong',    label: 'Strong' },
  { value: 'enormous',  label: 'Enormous' },
]
const SEASONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
  { value: 'winter', label: 'Winter' },
]

interface Props {
  fragranceId: string
  fragranceName: string
  brandName: string
  onClose: () => void
  onSubmitted: () => void
}

export default function RatingModal({ fragranceId, fragranceName, brandName, onClose, onSubmitted }: Props) {
  const [score,     setScore]     = useState<number | null>(null)
  const [longevity, setLongevity] = useState<string>('')
  const [sillage,   setSillage]   = useState<string>('')
  const [seasons,   setSeasons]   = useState<string[]>([])
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [done,      setDone]      = useState(false)

  function toggleSeason(s: string) {
    setSeasons(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!score) { setError('Please give a score.'); return }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragrance_id: fragranceId, score, longevity, sillage, season: seasons, recommend }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong.')
      return
    }
    setDone(true)
    setTimeout(onSubmitted, 1200)
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Rate fragrance"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.panel}>
        <button className={styles.close} aria-label="Close" onClick={onClose}>
          <X weight="bold" size={16} />
        </button>

        {done ? (
          <div className={styles.done}>
            <div className={styles.doneCheck}><Check weight="bold" size={28} /></div>
            <p className={styles.doneTitle}>Rating saved</p>
            <p className={styles.doneSub}>Thanks for rating {fragranceName}</p>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Rate this fragrance</h2>
            <p className={styles.sub}>{fragranceName} <span className={styles.subBrand}>by {brandName}</span></p>

            <form onSubmit={submit} className={styles.form}>
              {/* Score */}
              <div className={styles.section}>
                <div className={styles.label}>Your score <span className={styles.required}>*</span></div>
                <div className={styles.scoreRow}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.scoreBtn} ${score === n ? styles.scoreBtnOn : ''}`}
                      onClick={() => setScore(n)}
                      aria-pressed={score === n}
                      aria-label={`Score ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {score && <p className={styles.scoreLabel}>{scoreLabel(score)}</p>}
              </div>

              {/* Longevity */}
              <div className={styles.section}>
                <div className={styles.label}>Longevity</div>
                <div className={styles.pills}>
                  {LONGEVITY.map(({ value, label }) => (
                    <button key={value} type="button"
                      className={`${styles.pill} ${longevity === value ? styles.pillOn : ''}`}
                      onClick={() => setLongevity(prev => prev === value ? '' : value)}
                      aria-pressed={longevity === value}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Sillage */}
              <div className={styles.section}>
                <div className={styles.label}>Sillage (projection)</div>
                <div className={styles.pills}>
                  {SILLAGE.map(({ value, label }) => (
                    <button key={value} type="button"
                      className={`${styles.pill} ${sillage === value ? styles.pillOn : ''}`}
                      onClick={() => setSillage(prev => prev === value ? '' : value)}
                      aria-pressed={sillage === value}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Season */}
              <div className={styles.section}>
                <div className={styles.label}>Best season</div>
                <div className={styles.pills}>
                  {SEASONS.map(({ value, label }) => (
                    <button key={value} type="button"
                      className={`${styles.pill} ${seasons.includes(value) ? styles.pillOn : ''}`}
                      onClick={() => toggleSeason(value)}
                      aria-pressed={seasons.includes(value)}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Recommend */}
              <div className={styles.section}>
                <div className={styles.label}>Would you recommend?</div>
                <div className={styles.recRow}>
                  <button type="button"
                    className={`${styles.recBtn} ${recommend === true ? styles.recBtnYes : ''}`}
                    onClick={() => setRecommend(prev => prev === true ? null : true)}
                    aria-pressed={recommend === true}
                  >Yes</button>
                  <button type="button"
                    className={`${styles.recBtn} ${recommend === false ? styles.recBtnNo : ''}`}
                    onClick={() => setRecommend(prev => prev === false ? null : false)}
                    aria-pressed={recommend === false}
                  >No</button>
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={`btn-primary ${styles.submit}`} disabled={loading || !score}>
                {loading ? 'Saving…' : 'Submit rating'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function scoreLabel(n: number) {
  if (n <= 2)  return 'Poor'
  if (n <= 4)  return 'Below average'
  if (n <= 6)  return 'Average'
  if (n <= 7)  return 'Good'
  if (n <= 8)  return 'Very good'
  if (n <= 9)  return 'Excellent'
  return 'Masterpiece'
}
