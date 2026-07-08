// Central affiliate configuration.
//
// All IDs come from env vars so production values live in Vercel, never in code:
//   NEXT_PUBLIC_AMAZON_TAG      — Amazon Associates UK tracking tag (e.g. perfy0a-21)
//   NEXT_PUBLIC_AWIN_ID         — Awin publisher (affiliate) ID
//   NEXT_PUBLIC_AWIN_MID_*      — Awin advertiser IDs, one per approved retailer programme
//
// A retailer only renders when its env vars are present, so unapproved
// programmes simply don't appear.

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? ''
const AWIN_ID    = process.env.NEXT_PUBLIC_AWIN_ID ?? ''

export function amazonSearchUrl(brand: string, name: string, concentration?: string): string {
  const q = [brand, name, concentration].filter(Boolean).join(' ')
  return `https://www.amazon.co.uk/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`
}

/** Awin deeplink wrapper — sends the click through Awin tracking to the target URL. */
function awinDeeplink(advertiserId: string, targetUrl: string): string {
  return `https://www.awin1.com/cread.php?awinmid=${advertiserId}&awinaffid=${AWIN_ID}&ued=${encodeURIComponent(targetUrl)}`
}

interface AwinRetailerDef {
  name:      string
  note:      string
  midEnv:    string | undefined
  searchUrl: (query: string) => string
}

const AWIN_RETAILERS: AwinRetailerDef[] = [
  {
    name:      'The Perfume Shop',
    note:      'UK high-street retailer',
    midEnv:    process.env.NEXT_PUBLIC_AWIN_MID_PERFUMESHOP,
    searchUrl: q => `https://www.theperfumeshop.com/search?text=${encodeURIComponent(q)}`,
  },
  {
    name:      'Notino',
    note:      'Wide range, frequent discounts',
    midEnv:    process.env.NEXT_PUBLIC_AWIN_MID_NOTINO,
    searchUrl: q => `https://www.notino.co.uk/search/?q=${encodeURIComponent(q)}`,
  },
  {
    name:      'LookFantastic',
    note:      'Beauty retailer, free UK delivery',
    midEnv:    process.env.NEXT_PUBLIC_AWIN_MID_LOOKFANTASTIC,
    searchUrl: q => `https://www.lookfantastic.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name:      'Fragrance Direct',
    note:      'Discount fragrance specialist',
    midEnv:    process.env.NEXT_PUBLIC_AWIN_MID_FRAGRANCEDIRECT,
    searchUrl: q => `https://www.fragrancedirect.co.uk/search?q=${encodeURIComponent(q)}`,
  },
  {
    name:      'AllBeauty',
    note:      'Discount fragrance specialist',
    midEnv:    process.env.NEXT_PUBLIC_AWIN_MID_ALLBEAUTY,
    searchUrl: q => `https://www.allbeauty.com/gb/en/search?q=${encodeURIComponent(q)}`,
  },
]

export interface RetailerLink {
  name: string
  note: string
  url:  string
}

/** Awin retailer search links for a fragrance — only programmes with IDs configured. */
export function awinRetailerLinks(brand: string, name: string): RetailerLink[] {
  if (!AWIN_ID) return []
  const q = `${brand} ${name}`
  return AWIN_RETAILERS
    .filter(r => r.midEnv)
    .map(r => ({
      name: r.name,
      note: r.note,
      url:  awinDeeplink(r.midEnv!, r.searchUrl(q)),
    }))
}
