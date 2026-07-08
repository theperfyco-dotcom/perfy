'use client'

import { useState } from 'react'
import type { Statement } from '@/lib/db'
import styles from './StatementsSection.module.css'

interface Props {
  fragranceId:        string
  initialStatements:  Statement[]
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)   return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function StatementsSection({ fragranceId, initialStatements }: Props) {
  const [statements, setStatements] = useState<Statement[]>(initialStatements)
  const [body, setBody]     = useState('')
  const [sentiment, setSentiment] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    if (body.length < 10 || body.length > 500) {
      setError('Statement must be 10–500 characters.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragrance_id:   fragranceId,
          statement_body: body,
          is_positive:    sentiment,
        }),
      })
      if (!res.ok) { setError('Could not submit — please try again.'); return }
      const { id } = await res.json() as { id: string }
      const newStmt: Statement = {
        id, body, score_scent: null, score_longevity: null,
        score_sillage: null, is_positive: sentiment, created_at: new Date().toISOString(),
      }
      setStatements(prev => [newStmt, ...prev])
      setBody('')
      setSentiment(null)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const charCount = body.length

  return (
    <div className={styles.root}>
      <h2 className={styles.heading} id="statements-heading">Community <em>statements</em></h2>

      {/* Statement list */}
      {statements.length > 0 ? (
        <div className={styles.list}>
          {statements.map(s => (
            <div key={s.id} className={`${styles.card} ${s.is_positive === true ? styles.cardPos : s.is_positive === false ? styles.cardNeg : ''}`}>
              {s.is_positive !== null && (
                <span className={styles.sentiment}>{s.is_positive ? '+ Positive' : '− Negative'}</span>
              )}
              <p className={styles.cardBody}>{s.body}</p>
              <span className={styles.cardTime}>{timeAgo(s.created_at)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No community statements yet — share your first take below.</p>
      )}

      {/* Submit form */}
      {!submitted ? (
        <div className={styles.form}>
          <div className={styles.formHead}>
            <span className={styles.formLabel}>Share your take</span>
            <span className={`${styles.charCount} ${charCount > 450 ? styles.charCountWarn : ''}`}>
              {charCount}/500
            </span>
          </div>
          <textarea
            className={styles.textarea}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Describe how it smells, wears, or when you'd reach for it — 10 to 500 characters."
            rows={3}
            maxLength={500}
          />
          <div className={styles.formFooter}>
            <div className={styles.sentimentBtns}>
              <button
                className={`${styles.sentBtn} ${sentiment === true ? styles.sentBtnPos : ''}`}
                onClick={() => setSentiment(sentiment === true ? null : true)}
                type="button"
              >
                + Positive
              </button>
              <button
                className={`${styles.sentBtn} ${sentiment === false ? styles.sentBtnNeg : ''}`}
                onClick={() => setSentiment(sentiment === false ? null : false)}
                type="button"
              >
                − Negative
              </button>
            </div>
            {error && <span className={styles.formError}>{error}</span>}
            <button
              className={styles.submitBtn}
              onClick={submit}
              disabled={submitting || charCount < 10}
              type="button"
            >
              {submitting ? 'Posting…' : 'Post statement'}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.thanks}>Thanks for sharing your take!</p>
      )}
    </div>
  )
}
