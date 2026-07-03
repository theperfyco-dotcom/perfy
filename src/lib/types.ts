export type AccordName =
  | 'Fresh' | 'Floral' | 'Woody' | 'Spicy' | 'Citrus'
  | 'Amber' | 'Musky' | 'Green' | 'Oud' | 'Leather'
  | 'Dark' | 'Powdery' | 'Fruity' | 'Aromatic' | 'Smoky'

export interface Accord {
  name: AccordName | string
  percentage: number
  color_hex?: string
}

export interface Note {
  id: string
  name: string
  family: string
}

export interface Brand {
  id: string
  slug: string
  name: string
  country?: string
  description?: string
  logo_url?: string
}

export interface Fragrance {
  id: string
  slug: string
  name: string
  brand: Brand
  description?: string
  year?: number
  concentration?: string
  gender?: 'masculine' | 'feminine' | 'unisex'
  image_url?: string
  accords?: Accord[]
  top_notes?: Note[]
  heart_notes?: Note[]
  base_notes?: Note[]
  avg_score?: number
  rating_count?: number
  recommend_pct?: number
  avg_longevity?: string
  avg_sillage?: string
  longevity_dist?: Record<string, number>
  sillage_dist?: Record<string, number>
  gender_dist?: { masculine: number; feminine: number; unisex: number }
  prices?: FragrancePrice[]
}

export interface FragrancePrice {
  id: string
  retailer: Retailer
  size_ml: number
  price: number
  currency: string
  affiliate_url: string
}

export interface Retailer {
  id: string
  name: string
}

export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  is_creator: boolean
}

export interface Rating {
  id: string
  user: Profile
  fragrance_id: string
  score: number
  longevity?: string
  sillage?: string
  season?: string[]
  recommend?: boolean
  review_text?: string
  created_at: string
}

export interface Dupe {
  id: string
  original: Fragrance
  dupe: Fragrance
  match_percentage: number
  vote_count: number
  price_saving?: number
}

export interface List {
  id: string
  user: Profile
  title: string
  description?: string
  is_public: boolean
  items: Fragrance[]
  created_at: string
}
