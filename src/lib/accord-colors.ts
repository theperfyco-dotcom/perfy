export const ACCORD_COLORS: Record<string, string> = {
  Fresh:    '#9FC4D4',
  Floral:   '#D4A5A5',
  Woody:    '#C4A07A',
  Spicy:    '#CC8B6E',
  Citrus:   '#D4C47A',
  Amber:    '#D4AA6E',
  Musky:    '#B8A8CC',
  Green:    '#8DC4A0',
  Oud:      '#8C78CC',
  Leather:  '#9C7A5A',
  Dark:     '#6E6480',
  Smoky:    '#6E6480',
  Powdery:  '#C8B8C8',
  Fruity:   '#8DC4A0',
  Aromatic: '#A0C4A0',
}

export function getAccordColor(name: string): string {
  return ACCORD_COLORS[name] ?? '#C0B8B0'
}
