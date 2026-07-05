'use client'
import { useState } from 'react'
import { Star, CheckCircle, FloppyDisk } from '@phosphor-icons/react'
import { useAuth } from '@/providers/AuthProvider'
import type { Fragrance } from '@/lib/types'
import styles from './VoteCard.module.css'

const SCALES = [
  { key: 'longevity_v2',  distKey: 'longevity',   label: 'Longevity',     options: ['Barely there', 'Weak',         'Moderate',   'Long-lasting', 'Eternal'     ] },
  { key: 'sillage_v2',    distKey: 'sillage',     label: 'Sillage',       options: ['Skin scent',   'Close',        'Moderate',   'Strong',       'Beast mode'  ] },
  { key: 'gender_rating', distKey: 'gender',      label: 'Gender',        options: ['All female',   'Mostly female','Unisex',     'Mostly male',  'All male'    ] },
  { key: 'price_value',   distKey: 'price_value', label: 'Price & value', options: ['Way overpriced','Overpriced',  'Fair price', 'Good value',   'Great value' ] },
] as const

type ScaleKey = typeof SCALES[number]['key']
type DistKey  = typeof SCALES[number]['distKey']

const PENDING_KEY = 'perfy_pending_vote'

interface Props {
  fragranceId:   string
  fragranceName: string
  scaleDists?:   Fragrance['scale_dists']
}

export default function VoteCard({ fragranceId, fragranceName, scaleDists }: Props) {
  const { user, openAuthModal } = useAuth()
  const [score,      setScore]      = useState<number | null>(null)
  const [votes,      setVotes]      = useState<Record<ScaleKey, number | null>>({
    longevity_v2: null, sillage_v2: null, gender_rating: null, price_value: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function setVote(key: ScaleKey, val: number) {
    setVotes(prev => ({ ...prev, [key]: prev[key] === val ? null : val }))
  }

  async function submit() {
    if (!score) return
    setSubmitting(true)
    setError(null)

    const payload = {
      fragrance_id:  fragranceId,
      score,
      longevity_v2:  votes.longevity_v2,
      sillage_v2:    votes.sillage_v2,
      gender_rating: votes.gender_rating,
      price_value:   votes.price_value,
    }

    if (user) {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSubmitting(false)
      if (!res.ok) {
        const { error: msg } = await res.json()
        setError(msg ?? 'Something went wrong.')
        return
      }
    } else {
      // Hold in localStorage — flushed to DB when they sign up
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)) } catch {}
      setSubmitting(false)
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className={styles.doneWrap}>
        {/* Success header */}
        <div className={styles.doneHeader}>
          <CheckCircle weight="fill" size={20} className={styles.doneCheck} />
          <span>{user ? 'Rating saved — thanks!' : 'Vote recorded'}</span>
        </div>

        {/* Score + scale summary */}
        <div className={styles.doneBody}>
          <div className={styles.doneScoreBlock}>
            <div className={styles.doneScore}>{score}<span>/10</span></div>
            <div className={styles.doneScoreLabel}>{scoreLabel(score!)}</div>
          </div>

          <div className={styles.doneSummary}>
            {SCALES.map(({ key, distKey, label, options }) => {
              const userVote = votes[key]
              const dist     = scaleDists?.[distKey as DistKey]
              const peakIdx  = dist ? dist.indexOf(Math.max(...dist)) : -1
              return (
                <div key={key} className={styles.doneSummaryRow}>
                  <span className={styles.doneSummaryLabel}>{label}</span>
                  {userVote ? (
                    <div className={styles.doneSummaryVal}>
                      <span className={styles.doneSummaryOpt}>{options[userVote - 1]}</span>
                      {dist && peakIdx >= 0 && (
                        <span className={styles.doneSummaryCommunity}>
                          Community: {options[peakIdx]} ({dist[peakIdx]}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={styles.doneSummarySkipped}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Save prompt — only for anonymous voters */}
        {!user && (
          <div className={styles.savePrompt}>
            <FloppyDisk size={22} weight="duotone" className={styles.saveIcon} />
            <div className={styles.saveContent}>
              <div className={styles.saveTitle}>Save your rating permanently</div>
              <p className={styles.saveSub}>
                Create a free account to keep track of what you've tried, build your collection, and see how your taste compares to the community.
              </p>
              <div className={styles.saveBtns}>
                <button className="btn-primary" onClick={openAuthModal}>Create free account</button>
                <button className={styles.saveSignIn} onClick={openAuthModal}>Sign in instead</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.card}>

      {/* Score */}
      <div className={styles.col}>
        <div className={styles.colTitle}><Star weight="fill" size={13} /> Score</div>
        <div className={styles.scoreGrid} role="group" aria-label="Select overall score 1–10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n}
              className={`${styles.scoreBtn} ${score === n ? styles.scoreBtnActive : ''}`}
              aria-pressed={score === n}
              onClick={() => setScore(score === n ? null : n)}
            >{n}</button>
          ))}
        </div>
        {score && <p className={styles.scoreHint}>{scoreLabel(score)}</p>}
      </div>

      {/* 4 scales — with community ghost bars */}
      {SCALES.map(({ key, distKey, label, options }) => {
        const dist = scaleDists?.[distKey as DistKey]
        return (
          <div key={key} className={styles.col}>
            <div className={styles.colTitle}>{label}</div>
            <div className={styles.options} role="group" aria-label={`Vote on ${label}`}>
              {options.map((opt, i) => {
                const val          = i + 1
                const active       = votes[key] === val
                const communityPct = dist?.[i] ?? 0
                return (
                  <button key={opt}
                    className={`${styles.option} ${active ? styles.active : ''}`}
                    onClick={() => setVote(key, val)}
                    aria-pressed={active}
                    style={{ '--cpct': `${communityPct}%` } as React.CSSProperties}
                  >
                    {communityPct > 0 && <span className={styles.ghostBar} aria-hidden="true" />}
                    <span className={styles.optNum}>{val}</span>
                    <span className={styles.optLabel}>{opt}</span>
                    {communityPct > 0 && <span className={styles.optCpct}>{communityPct}%</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Submit */}
      <div className={`${styles.col} ${styles.submitCol}`}>
        <div className={styles.colTitle}>Submit</div>
        {!score && <p className={styles.authNote}>Select a score to submit your vote</p>}
        {error && <p className={styles.errMsg}>{error}</p>}
        <button
          className={`btn-primary ${styles.submitBtn}`}
          onClick={submit}
          disabled={!score || submitting}
        >
          {submitting ? 'Saving…' : !score ? 'Pick a score first' : user ? 'Submit rating' : 'Submit vote'}
        </button>
        <p className={styles.submitNote}>
          {user ? 'Score required · other fields optional' : 'No account needed · save it after'}
        </p>
      </div>

    </div>
  )
}

function scoreLabel(n: number) {
  return ['', 'Avoid', 'Poor', 'Below average', 'Average', 'Decent', 'Good', 'Very good', 'Excellent', 'Outstanding', 'Masterpiece'][n] ?? ''
}
