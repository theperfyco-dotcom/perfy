'use client'

import { useState } from 'react'
import { Hourglass, Wind, UsersThree, Tag } from '@phosphor-icons/react'
import type { PerfStats } from '@/lib/db'
import styles from './PerformanceRating.module.css'

const ATTRS = [
  {
    key:      'longevity'   as const,
    label:    'Longevity',
    Icon:     Hourglass,
    options:  ['Barely there', 'Weak', 'Moderate', 'Long-lasting', 'Eternal'],
    short:    ['Barely', 'Weak', 'Mod.', 'Long', 'Eternal'],
  },
  {
    key:      'sillage'     as const,
    label:    'Sillage',
    Icon:     Wind,
    options:  ['Skin scent', 'Close', 'Moderate', 'Strong', 'Beast mode'],
    short:    ['Skin', 'Close', 'Mod.', 'Strong', 'Beast'],
  },
  {
    key:      'gender'      as const,
    label:    'Gender',
    Icon:     UsersThree,
    options:  ['All female', 'Mostly female', 'Unisex', 'Mostly male', 'All male'],
    short:    ['Female', 'Fem.', 'Unisex', 'Masc.', 'Male'],
  },
  {
    key:      'price_value' as const,
    label:    'Price & Value',
    Icon:     Tag,
    options:  ['Way overpriced', 'Overpriced', 'Fair price', 'Good value', 'Great value'],
    short:    ['Way ↑', 'Overp.', 'Fair', 'Good', 'Great'],
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
    const prev     = userVotes[attr]
    const newVal   = prev === val ? 0 : val  // toggle off if same dot clicked

    // Optimistic update
    setUserVotes(v => newVal === 0 ? { ...v, [attr]: undefined } : { ...v, [attr]: newVal })
    setStats(s => {
      const counts = [...s[attr]]
      if (prev && prev >= 1 && prev <= 5) counts[prev - 1] = Math.max(0, counts[prev - 1] - 1)
      if (newVal >= 1)                    counts[newVal - 1]++
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
        {ATTRS.map(({ key, label, Icon, options, short }) => {
          const counts = stats[key]
          const total  = counts.reduce((a, b) => a + b, 0)
          const max    = total > 0 ? Math.max(...counts) : 0
          const peak   = max > 0 ? counts.indexOf(max) : -1
          const uVote  = userVotes[key]

          return (
            <div key={key} className={styles.card}>

              {/* Card header */}
              <div className={styles.cardHead}>
                <Icon size={18} weight="duotone" className={styles.cardIcon} aria-hidden="true" />
                <span className={styles.cardLabel}>{label}</span>
                {total > 0 && <span className={styles.voteCount}>{total.toLocaleString()} votes</span>}
              </div>

              {/* Dot scale */}
              <div className={styles.scaleWrap}>
                <span className={styles.noVote}>no vote</span>
                <div className={styles.dots} role="group" aria-label={`Rate ${label}`}>
                  <div className={styles.dotLine} aria-hidden="true" />
                  {options.map((opt, i) => {
                    const val    = i + 1
                    const active = uVote === val
                    return (
                      <button
                        key={opt}
                        className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                        onClick={() => vote(key, val)}
                        aria-pressed={active}
                        aria-label={opt}
                        disabled={pending.has(key)}
                      >
                        <span className={styles.dotCircle} aria-hidden="true" />
                        <span className={styles.dotLabel}>{short[i]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Distribution */}
              <div className={styles.dist}>
                {total === 0 ? (
                  <p className={styles.distEmpty}>No votes yet — be the first</p>
                ) : (
                  options.map((opt, i) => {
                    const count  = counts[i] ?? 0
                    const barPct = max > 0 ? (count / max) * 100 : 0
                    const isPeak = i === peak && count > 0
                    const isUser = uVote === i + 1
                    return (
                      <div
                        key={opt}
                        className={`${styles.distRow} ${isPeak ? styles.distPeak : ''} ${isUser ? styles.distUser : ''}`}
                      >
                        <span className={styles.distLabel}>{opt}</span>
                        <div className={styles.distTrack}>
                          <div className={styles.distFill} style={{ width: `${barPct}%` }} />
                        </div>
                        <span className={styles.distCount}>{count}</span>
                      </div>
                    )
                  })
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
