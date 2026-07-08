'use client'

import { useState } from 'react'
import { Hourglass, Wind, UsersThree, Tag } from '@phosphor-icons/react'
import type { PerfStats } from '@/lib/db'
import styles from './PerformanceRating.module.css'

const ATTRS = [
  {
    key:      'longevity'   as const,
    label:    'Longevity',
    question: 'How long does it last?',
    Icon:     Hourglass,
    options:  ['Barely there', 'Weak', 'Moderate', 'Long-lasting', 'Eternal'],
  },
  {
    key:      'sillage'     as const,
    label:    'Sillage',
    question: 'How far does it project?',
    Icon:     Wind,
    options:  ['Skin scent', 'Close', 'Moderate', 'Strong', 'Beast mode'],
  },
  {
    key:      'gender'      as const,
    label:    'Gender',
    question: 'Who does it suit most?',
    Icon:     UsersThree,
    options:  ['All female', 'Mostly female', 'Unisex', 'Mostly male', 'All male'],
  },
  {
    key:      'price_value' as const,
    label:    'Price & Value',
    question: 'Is it worth the money?',
    Icon:     Tag,
    options:  ['Way overpriced', 'Overpriced', 'Fair price', 'Good value', 'Great value'],
  },
] as const

type AttrKey = typeof ATTRS[number]['key']

function getSessionId(): string {
  try {
    let id = localStorage.getItem('perfy_sid')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('perfy_sid', id) }
    return id
  } catch { return 'anon' }
}

interface Props {
  fragranceId:  string
  initialStats: PerfStats
}

export default function PerformanceRating({ fragranceId, initialStats }: Props) {
  const [stats,     setStats]     = useState<PerfStats>(initialStats)
  const [userVotes, setUserVotes] = useState<Partial<Record<AttrKey, number>>>({})
  const [pending,   setPending]   = useState<Set<AttrKey>>(new Set())

  async function vote(attr: AttrKey, val: number) {
    if (pending.has(attr)) return
    const prev   = userVotes[attr]
    const newVal = prev === val ? 0 : val

    setUserVotes(v => newVal === 0 ? { ...v, [attr]: undefined } : { ...v, [attr]: newVal })
    setStats(s => {
      const counts = [...s[attr]]
      if (prev && prev >= 1 && prev <= 5) counts[prev - 1] = Math.max(0, counts[prev - 1] - 1)
      if (newVal >= 1) counts[newVal - 1]++
      return { ...s, [attr]: counts }
    })

    setPending(p => new Set(p).add(attr))
    try {
      const sid = getSessionId()
      await fetch('/api/perf-vote', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sid },
        body:    JSON.stringify({ fragrance_id: fragranceId, attribute: attr, value: newVal }),
      })
    } catch { /* noop */ }
    setPending(p => { const n = new Set(p); n.delete(attr); return n })
  }

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {ATTRS.map(({ key, label, question, Icon, options }) => {
          const counts = stats[key]
          const total  = counts.reduce((a, b) => a + b, 0)
          const maxCount = total > 0 ? Math.max(...counts) : 0
          const peak   = maxCount > 0 ? counts.indexOf(maxCount) : -1
          const uVote  = userVotes[key]

          return (
            <div key={key} className={`${styles.card} ${uVote ? styles.cardVoted : ''}`}>

              {/* Header */}
              <div className={styles.cardHead}>
                <Icon size={20} weight="duotone" className={styles.cardIcon} aria-hidden="true" />
                <div>
                  <div className={styles.cardLabel}>{label}</div>
                  <div className={styles.cardQuestion}>{question}</div>
                </div>
                {total > 0 && (
                  <span className={styles.voteCount}>{total.toLocaleString()} votes</span>
                )}
              </div>

              {/* Vote rows — the bar IS the button: tap a row to vote,
                  the fill shows where community votes land */}
              <div className={styles.rows} role="group" aria-label={`Rate ${label}`}>
                {options.map((opt, i) => {
                  const val    = i + 1
                  const count  = counts[i] ?? 0
                  const pct    = total > 0 ? Math.round((count / total) * 100) : 0
                  const isPeak = i === peak && count > 0
                  const isUser = uVote === val
                  return (
                    <button
                      key={opt}
                      className={`${styles.row} ${isPeak ? styles.rowPeak : ''} ${isUser ? styles.rowUser : ''}`}
                      onClick={() => vote(key, val)}
                      aria-pressed={isUser}
                      disabled={pending.has(key)}
                      title={isUser ? `Remove your "${opt}" vote` : `Vote "${opt}"`}
                    >
                      <span className={styles.rowLabel}>
                        {opt}
                        {isUser && <span className={styles.youTag}>you</span>}
                      </span>
                      <span className={styles.rowTrack}>
                        <span className={styles.rowFill} style={{ width: `${pct}%` }} />
                      </span>
                      <span className={styles.rowPct}>{total > 0 ? `${pct}%` : ''}</span>
                    </button>
                  )
                })}
              </div>

              {/* Status line — confirmation or prompt */}
              {uVote ? (
                <div className={styles.votedRow}>
                  <span className={styles.votedCheck}>✓</span>
                  <span className={styles.votedText}>You rated: <strong>{options[uVote - 1]}</strong></span>
                  <button className={styles.changeBtn} onClick={() => vote(key, uVote)}>
                    Undo
                  </button>
                </div>
              ) : (
                <p className={styles.hint}>
                  {total > 0 ? 'Tap an option to add your vote' : 'No votes yet — tap an option to be first'}
                </p>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}
