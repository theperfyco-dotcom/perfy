'use client'

import { useState, useEffect } from 'react'
import styles from './CollectionButton.module.css'

const STATUSES = [
  { key: 'owned',    label: 'Owned'    },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'worn',     label: 'Worn'     },
] as const

type Status = typeof STATUSES[number]['key']

function getStorageKey(fragranceId: string) {
  return `collection_${fragranceId}`
}

function readLocal(fragranceId: string): Set<Status> {
  try {
    const raw = localStorage.getItem(getStorageKey(fragranceId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as Status[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeLocal(fragranceId: string, statuses: Set<Status>) {
  try {
    localStorage.setItem(getStorageKey(fragranceId), JSON.stringify([...statuses]))
  } catch { /* noop */ }
}

interface Props {
  fragranceId: string
}

export default function CollectionButton({ fragranceId }: Props) {
  const [active, setActive] = useState<Set<Status>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setActive(readLocal(fragranceId))
    setMounted(true)
  }, [fragranceId])

  function toggle(status: Status) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
        fetch('/api/collection?' + new URLSearchParams({ fragrance_id: fragranceId, status }), { method: 'DELETE' }).catch(() => {})
      } else {
        next.add(status)
        fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fragrance_id: fragranceId, status }),
        }).catch(() => {})
      }
      writeLocal(fragranceId, next)
      return next
    })
  }

  if (!mounted) return null

  return (
    <div className={styles.root}>
      {STATUSES.map(({ key, label }) => (
        <button
          key={key}
          className={`${styles.btn} ${active.has(key) ? styles.btnActive : ''}`}
          onClick={() => toggle(key)}
          aria-pressed={active.has(key)}
        >
          {active.has(key) ? '✓ ' : ''}
          {label}
        </button>
      ))}
    </div>
  )
}
