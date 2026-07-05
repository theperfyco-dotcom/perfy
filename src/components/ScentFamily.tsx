import styles from './ScentFamily.module.css'

const FAMILY: Record<string, { bg: string; text: string; border: string }> = {
  woody:     { bg: '#F3EBE3', text: '#6B3F1A', border: '#A8724A' },
  woods:     { bg: '#F3EBE3', text: '#6B3F1A', border: '#A8724A' },
  amber:     { bg: '#FEF2DF', text: '#8C4500', border: '#CF7318' },
  warm:      { bg: '#FEF2DF', text: '#8C4500', border: '#CF7318' },
  soft:      { bg: '#F6F0E8', text: '#6B5030', border: '#C4A06A' },
  classical: { bg: '#EEE8DF', text: '#5C4030', border: '#9B7A52' },
  richer:    { bg: '#EAE3DA', text: '#483020', border: '#826348' },
  rich:      { bg: '#EAE3DA', text: '#483020', border: '#826348' },
  deep:      { bg: '#E8E0D5', text: '#3C2818', border: '#7A5E40' },
  floral:    { bg: '#FCEAF4', text: '#8B2060', border: '#D46899' },
  rose:      { bg: '#FDEAEA', text: '#8B1A1A', border: '#C84040' },
  flower:    { bg: '#FCEAF4', text: '#8B2060', border: '#D46899' },
  fresh:     { bg: '#E6F3FB', text: '#1052A0', border: '#3880C8' },
  fresher:   { bg: '#E6F3FB', text: '#1052A0', border: '#3880C8' },
  water:     { bg: '#E3EFF8', text: '#0F4880', border: '#2E70B8' },
  aquatic:   { bg: '#E3EFF8', text: '#0F4880', border: '#2E70B8' },
  citrus:    { bg: '#FEFBE6', text: '#6A5800', border: '#B89E00' },
  fruity:    { bg: '#FEE9F2', text: '#8B0050', border: '#CF4088' },
  green:     { bg: '#E8F5EA', text: '#185C20', border: '#2E8C38' },
  herbal:    { bg: '#E8F5EA', text: '#185C20', border: '#2E8C38' },
  oriental:  { bg: '#F5E6E6', text: '#780E0E', border: '#B83030' },
  spicy:     { bg: '#F5E8E5', text: '#7A1800', border: '#B84020' },
  leather:   { bg: '#EBE4DC', text: '#3C2418', border: '#6A4830' },
  smoky:     { bg: '#EAECED', text: '#202C30', border: '#4A5C60' },
  musk:      { bg: '#EEE9F0', text: '#4A3558', border: '#8868A0' },
  powdery:   { bg: '#F4ECF8', text: '#600080', border: '#A040C0' },
  powder:    { bg: '#F4ECF8', text: '#600080', border: '#A040C0' },
  vanilla:   { bg: '#FEF0E0', text: '#7A3800', border: '#C06800' },
  gourmand:  { bg: '#FEF0E0', text: '#7A3800', border: '#C06800' },
}

const DEFAULT = { bg: '#F0EEEC', text: '#4A4038', border: '#B0A090' }

interface Props {
  classification: string
}

export default function ScentFamily({ classification }: Props) {
  const words = classification.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return null

  return (
    <div className={styles.root} aria-label={`Fragrance family: ${classification}`}>
      {words.map(word => {
        const c = FAMILY[word.toLowerCase()] ?? DEFAULT
        return (
          <span
            key={word}
            className={styles.pill}
            style={{ background: c.bg, color: c.text, borderColor: c.border }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
