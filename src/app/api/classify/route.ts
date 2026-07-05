import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VALID_SEASONS   = ['spring','summer','autumn','winter'] as const
const VALID_OCCASIONS = ['daily','office','evening','sport','formal','date'] as const
const VALID_STYLES    = ['fresh','elegant','casual','sporty','romantic','bold','dark','cozy'] as const

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fragrance_id, season, occasion, style, session_id } = body

  if (!fragrance_id) return NextResponse.json({ error: 'fragrance_id required' }, { status: 400 })
  if (season   && !VALID_SEASONS.includes(season))   return NextResponse.json({ error: 'Invalid season'   }, { status: 400 })
  if (occasion && !VALID_OCCASIONS.includes(occasion)) return NextResponse.json({ error: 'Invalid occasion' }, { status: 400 })
  if (style    && !VALID_STYLES.includes(style))     return NextResponse.json({ error: 'Invalid style'   }, { status: 400 })
  if (!season && !occasion && !style) return NextResponse.json({ error: 'Nothing to classify' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('fragrance_classifications').insert({
    fragrance_id,
    season:     season     ?? null,
    occasion:   occasion   ?? null,
    style:      style      ?? null,
    session_id: session_id ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
