import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fragrance_id, score, longevity, sillage, season, recommend } = await req.json()
  if (!fragrance_id || !score) {
    return NextResponse.json({ error: 'fragrance_id and score required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('ratings')
    .upsert(
      {
        fragrance_id,
        user_id: user.id,
        score,
        longevity: longevity || null,
        sillage: sillage || null,
        season: season?.length ? season : null,
        recommend: recommend ?? null,
      },
      { onConflict: 'user_id,fragrance_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
