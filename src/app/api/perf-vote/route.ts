import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const VALID_ATTRS = ['longevity', 'sillage', 'gender', 'price_value'] as const

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fragrance_id, attribute, value } = body
  const sessionId = req.headers.get('x-session-id') ?? 'anon'

  if (!fragrance_id) return NextResponse.json({ error: 'fragrance_id required' }, { status: 400 })
  if (!VALID_ATTRS.includes(attribute)) return NextResponse.json({ error: 'Invalid attribute' }, { status: 400 })
  if (typeof value !== 'number' || value < 0 || value > 5) {
    return NextResponse.json({ error: 'value must be 0–5' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (value === 0) {
    await supabase
      .from('fragrance_perf_votes')
      .delete()
      .eq('fragrance_id', fragrance_id)
      .eq('session_id', sessionId)
      .eq('attribute', attribute)
  } else {
    const { error } = await supabase
      .from('fragrance_perf_votes')
      .upsert(
        { fragrance_id, session_id: sessionId, attribute, value },
        { onConflict: 'fragrance_id,session_id,attribute' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
