import type { Accord } from '@/lib/types'
import { getAccordColor } from '@/lib/accord-colors'
import styles from './AccordBubbles.module.css'

interface Props {
  accords: Accord[]
  maxCount?: number
}

export default function AccordBubbles({ accords, maxCount = 8 }: Props) {
  const sorted = [...accords].sort((a, b) => b.percentage - a.percentage).slice(0, maxCount)
  if (!sorted.length) return null
  const max = sorted[0].percentage

  return (
    <div
      className={styles.bubbles}
      role="img"
      aria-label={`Scent profile: ${sorted.map(a => `${a.name} ${a.percentage}%`).join(', ')}`}
    >
      {sorted.map(a => {
        const norm = a.percentage / Math.max(max, 1)
        const size = Math.round(44 + norm * 52)
        const color = a.color_hex ?? getAccordColor(a.name)
        return (
          <div key={a.name} className={styles.accordItem}>
            <div
              className={styles.bubble}
              style={{ width: size, height: size, background: color }}
            />
            <span className={styles.name}>{a.name}</span>
            <span className={styles.pct}>{a.percentage}%</span>
          </div>
        )
      })}
    </div>
  )
}
