'use client'
import { useState } from 'react'
import { Clock, Wind, Star, ThumbsUp, ThumbsDown, CheckCircle } from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import styles from './VoteCard.module.css'

const LONGEVITY = [
  { label: 'Under 4 hrs', value: 'under-4hrs' },
  { label: '4–8 hours',   value: '4-8hrs'     },
  { label: '8–12 hours',  value: '8-12hrs'    },
  { label: '12–24 hours', value: '12-24hrs'   },
  { label: '24 hrs+',     value: '24hrs+'     },
]

const SILLAGE = [
  { label: 'Intimate', value: 'intimate' },
  { label: 'Soft',     value: 'soft'     },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Strong',   value: 'strong'   },
  { label: 'Enormous', value: 'enormous' },
]

interface Props {
  fragranceId: string
  fragranceName: string
}

export default function VoteCard({ fragranceId, fragranceName }: Props) {
  const { user, openAuthModal } = useAuth()

  const [score,     setScore]     = useState<number | null>(null)
  const [longevity, setLongevity] = useState<string | null>(null)
  const [sillage,   setSillage]   = useState<string | null>(null)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function guard(action: () => void) {
    if (!user) { openAuthModal(); return }
    action()
  }

  async function submit() {
    if (!score || !user) { if (!user) openAuthModal(); return }
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('ratings').upsert(
      { user_id: user.id, fragrance_id: fragranceId, score, longevity, sillage, recommend },
      { onConflict: 'user_id,fragrance_id' }
    )
    setSubmitting(false)
    if (err) setError(err.message)
    else setDone(true)
  }

  if (done) {
    return (
      <div className={styles.done}>
        <CheckCircle weight="fill" size={40} className={styles.doneIcon} />
        <div className={styles.doneScore}>{score}<span>/10</span></div>
        <div className={styles.doneTitle}>Rating saved</div>
        <p className={styles.doneSub}>Thanks for rating {fragranceName} — your vote helps the community.</p>
      </div>
    )
  }

  return (
    <div className={styles.card}>

      {/* Longevity */}
      <div className={styles.col}>
        <div className={styles.colTitle}><Clock weight="fill" size={14} /> Longevity</div>
        <div className={styles.options} role="group" aria-label="Vote on longevity">
          {LONGEVITY.map(o => (
            <button
              key={o.value}
              className={`${styles.option}${longevity === o.value ? ` ${styles.active}` : ''}`}
              onClick={() => guard(() => setLongevity(longevity === o.value ? null : o.value))}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* Sillage */}
      <div className={styles.col}>
        <div className={styles.colTitle}><Wind weight="fill" size={14} /> Sillage</div>
        <div className={styles.options} role="group" aria-label="Vote on sillage">
          {SILLAGE.map(o => (
            <button
              key={o.value}
              className={`${styles.option}${sillage === o.value ? ` ${styles.active}` : ''}`}
              onClick={() => guard(() => setSillage(sillage === o.value ? null : o.value))}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* Score + Recommend + Submit */}
      <div className={styles.col}>
        <div className={styles.colTitle}><Star weight="fill" size={14} /> Your score</div>

        <div className={styles.scoreGrid} role="group" aria-label="Select score 1–10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`${styles.scoreBtn}${score === n ? ` ${styles.scoreBtnActive}` : ''}`}
              aria-pressed={score === n}
              onClick={() => guard(() => setScore(score === n ? null : n))}
            >{n}</button>
          ))}
        </div>

        <div className={styles.recommendRow}>
          <button
            className={`${styles.option} ${styles.half}${recommend === true ? ` ${styles.active}` : ''}`}
            onClick={() => guard(() => setRecommend(recommend === true ? null : true))}
          ><ThumbsUp weight="bold" size={14} /> Recommend</button>
          <button
            className={`${styles.option} ${styles.half}${recommend === false ? ` ${styles.active}` : ''}`}
            onClick={() => guard(() => setRecommend(recommend === false ? null : false))}
          ><ThumbsDown weight="bold" size={14} /> Pass</button>
        </div>

        {!user && (
          <p className={styles.authNote}>
            <button className={styles.authLink} onClick={openAuthModal}>Sign in</button> to submit your rating
          </p>
        )}
        {error && <p className={styles.errMsg}>{error}</p>}

        <button
          className={`btn-primary ${styles.submitBtn}`}
          onClick={submit}
          disabled={!score || submitting || !user}
        >
          {submitting ? 'Saving…' : score && user ? 'Submit rating' : !user ? 'Sign in to rate' : 'Select a score above'}
        </button>
      </div>

    </div>
  )
}
