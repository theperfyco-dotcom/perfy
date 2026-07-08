// Fallback note-tier classification by perfumery volatility conventions.
// Used only when a fragrance has no top/heart/base data from the source —
// real tier data always wins.

const TOP_KEYWORDS = [
  'bergamot', 'lemon', 'lime', 'orange', 'mandarin', 'tangerine', 'grapefruit',
  'citrus', 'citron', 'yuzu', 'petitgrain', 'neroli', 'lavender', 'rosemary',
  'mint', 'peppermint', 'spearmint', 'basil', 'eucalyptus', 'aldehyde',
  'ginger', 'pink pepper', 'juniper', 'artemisia', 'galbanum', 'green notes',
  'apple', 'pear', 'melon', 'pineapple', 'blackcurrant', 'cassis', 'rhubarb',
  'sea notes', 'marine', 'aquatic', 'ozonic', 'anise', 'cardamom',
]

const BASE_KEYWORDS = [
  'vetiver', 'patchouli', 'sandalwood', 'cedar', 'cedarwood', 'oakmoss', 'moss',
  'amber', 'ambergris', 'ambroxan', 'musk', 'vanilla', 'tonka', 'benzoin',
  'labdanum', 'leather', 'suede', 'oud', 'agarwood', 'incense', 'olibanum',
  'frankincense', 'myrrh', 'resin', 'balsam', 'opoponax', 'castoreum', 'civet',
  'guaiac', 'birch', 'tobacco', 'coffee', 'cacao', 'chocolate', 'caramel',
  'praline', 'honey', 'wood', 'papyrus', 'vetiv', 'styrax', 'cashmeran',
]

export type NoteTier = 'top' | 'heart' | 'base'

export function classifyNoteTier(noteName: string): NoteTier {
  const n = noteName.toLowerCase()
  if (TOP_KEYWORDS.some(k => n.includes(k)))  return 'top'
  if (BASE_KEYWORDS.some(k => n.includes(k))) return 'base'
  // Everything else — florals, spices, fruits, gourmand hearts — sits in the middle
  return 'heart'
}

/** Split a flat note list into tiers. Returns null when the split is too
 *  lopsided to be useful (e.g. everything lands in one tier). */
export function classifyNotes<T extends { name: string }>(
  notes: T[],
): { top: T[]; heart: T[]; base: T[] } | null {
  if (notes.length < 3) return null
  const top:   T[] = []
  const heart: T[] = []
  const base:  T[] = []
  for (const note of notes) {
    const tier = classifyNoteTier(note.name)
    if (tier === 'top') top.push(note)
    else if (tier === 'base') base.push(note)
    else heart.push(note)
  }
  const tiersUsed = [top, heart, base].filter(t => t.length > 0).length
  return tiersUsed >= 2 ? { top, heart, base } : null
}
