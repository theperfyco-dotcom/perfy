'use client'

import { useState } from 'react'
import type { ClassificationStats } from '@/lib/db'
import styles from './ClassificationVoting.module.css'

const SEASONS   = ['spring','summer','autumn','winter'] as const
const OCCASIONS = ['daily','office','evening','sport','formal','date'] as const
const STYLES    = ['fresh','elegant','casual','sporty','romantic','bold','dark','cozy'] as const

type Season   = typeof SEASONS[number]
type Occasion = typeof OCCASIONS[number]
type Style    = typeof STYLES[number]

const SEASON_EMOJI: Record<Season, string>   = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }
const OCCASION_EMOJI: Record<Occasion, string> = { daily: '☕', office: '💼', evening: '🌙', sport: '⚡', formal: '🎩', date: '💐' }
const STYLE_EMOJI: Record<Style, string>     = { fresh: '💧', elegant: '✨', casual: '😌', sporty: '🏃', romantic: '🌹', bold: '🔥', dark: '🖤', cozy: '🍵' }

interface Props {
  fragranceId:   string
  initialStats:  ClassificationStats | null
}

interface VotedState {
  season?:   Season
  occasion?: Occasion
  style?:    Style
}

export default function ClassificationVoting({ fragranceId, initialStats }: Props) {
  const [stats, setStats]   = useState(initialStats)
  const [voted, setVoted]   = useState<VotedState>({})
  const [pending, setPending] = useState<Set<string>>(new Set())

  async function vote(dim: 'season' | 'occasion' | 'style', value: string) {
    const key = `${dim}_${value}`
    if (pending.has(key)) return

    setPending(p => new Set(p).add(key))
    setVoted(v => ({ ...v, [dim]: value }))

    // Optimistic update on stats
    setStats(prev => {
      if (!prev) return prev
      const next = { ...prev }
      const pctKey = `${value}_pct` as never  // rough optimistic
      void pctKey
      // Increment the vote count for this dimension
      if (dim === 'season')   next.season_votes   = (prev.season_votes   || 0) + 1
      if (dim === 'occasion') next.occasion_votes = (prev.occasion_votes || 0) + 1
      if (dim === 'style')    next.style_votes    = (prev.style_votes    || 0) + 1
      return next
    })

    try {
      await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragrance_id: fragranceId, [dim]: value }),
      })
    } catch { /* noop */ }

    setPending(p => { const n = new Set(p); n.delete(key); return n })
  }

  function pct(dim: 'season' | 'occasion' | 'style', value: string): number {
    if (!stats) return 0
    const map: Record<string, number> = {
      spring: stats.season.spring,   summer: stats.season.summer,
      autumn: stats.season.autumn,   winter: stats.season.winter,
      daily:  stats.occasion.daily,  office: stats.occasion.office,
      evening: stats.occasion.evening, sport: stats.occasion.sport,
      formal: stats.occasion.formal, date:  stats.occasion.date,
      fresh:  stats.style.fresh,     elegant: stats.style.elegant,
      casual: stats.style.casual,    sporty:  stats.style.sporty,
      romantic: stats.style.romantic, bold: stats.style.bold,
      dark:   stats.style.dark,      cozy:  stats.style.cozy,
    }
    void dim
    return Math.round(map[value] ?? 0)
  }

  function votes(dim: 'season' | 'occasion' | 'style'): number {
    if (!stats) return 0
    if (dim === 'season')   return stats.season_votes
    if (dim === 'occasion') return stats.occasion_votes
    return stats.style_votes
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.heading}>What&apos;s it like?</h3>
      <p className={styles.sub}>Add your take — community classifications help others find the right fragrance.</p>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Season <span className={styles.voteCount}>{votes('season')} votes</span></div>
        <div className={styles.chips}>
          {SEASONS.map(s => {
            const p = pct('season', s)
            const isVoted = voted.season === s
            return (
              <button
                key={s}
                className={`${styles.chip} ${isVoted ? styles.chipVoted : ''} ${p > 0 ? styles.chipHasVotes : ''}`}
                onClick={() => vote('season', s)}
                disabled={!!voted.season}
                style={{ '--fill': `${p}%` } as React.CSSProperties}
              >
                <span className={styles.chipEmoji}>{SEASON_EMOJI[s]}</span>
                <span className={styles.chipLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                {p > 0 && <span className={styles.chipPct}>{p}%</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Occasion <span className={styles.voteCount}>{votes('occasion')} votes</span></div>
        <div className={styles.chips}>
          {OCCASIONS.map(o => {
            const p = pct('occasion', o)
            const isVoted = voted.occasion === o
            return (
              <button
                key={o}
                className={`${styles.chip} ${isVoted ? styles.chipVoted : ''} ${p > 0 ? styles.chipHasVotes : ''}`}
                onClick={() => vote('occasion', o)}
                disabled={!!voted.occasion}
                style={{ '--fill': `${p}%` } as React.CSSProperties}
              >
                <span className={styles.chipEmoji}>{OCCASION_EMOJI[o]}</span>
                <span className={styles.chipLabel}>{o.charAt(0).toUpperCase() + o.slice(1)}</span>
                {p > 0 && <span className={styles.chipPct}>{p}%</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Style <span className={styles.voteCount}>{votes('style')} votes</span></div>
        <div className={styles.chips}>
          {STYLES.map(s => {
            const p = pct('style', s)
            const isVoted = voted.style === s
            return (
              <button
                key={s}
                className={`${styles.chip} ${isVoted ? styles.chipVoted : ''} ${p > 0 ? styles.chipHasVotes : ''}`}
                onClick={() => vote('style', s)}
                disabled={!!voted.style}
                style={{ '--fill': `${p}%` } as React.CSSProperties}
              >
                <span className={styles.chipEmoji}>{STYLE_EMOJI[s]}</span>
                <span className={styles.chipLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                {p > 0 && <span className={styles.chipPct}>{p}%</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
