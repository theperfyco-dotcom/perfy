import { Accord } from '@/lib/types'
import { getAccordColor } from '@/lib/accord-colors'

interface Props {
  accords: Accord[]
  height?: number
  showLabels?: boolean
  gap?: number
}

export default function AccordStrip({ accords, height = 48, showLabels = false, gap = 1.5 }: Props) {
  const total = accords.reduce((s, a) => s + a.percentage, 0)

  return (
    <div
      style={{
        display: 'flex',
        height,
        borderRadius: 2,
        overflow: 'hidden',
        gap,
      }}
      role="img"
      aria-label={`Scent profile: ${accords.map(a => `${a.name} ${a.percentage}%`).join(', ')}`}
    >
      {accords.map((accord) => (
        <div
          key={accord.name}
          style={{
            flex: accord.percentage / total,
            background: accord.color_hex ?? getAccordColor(accord.name),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: showLabels ? 6 : 0,
            minWidth: 0,
          }}
          title={`${accord.name} ${accord.percentage}%`}
        >
          {showLabels && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap' }}>
              {accord.name}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
