import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fragrance_id, statement_body, score_scent, score_longevity, score_sillage, is_positive, session_id } = body

  if (!fragrance_id || !statement_body || statement_body.length < 10 || statement_body.length > 500) {
    return NextResponse.json({ error: 'Invalid statement' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.from('fragrance_statements').insert({
    fragrance_id,
    body: statement_body,
    score_scent:    score_scent    ?? null,
    score_longevity: score_longevity ?? null,
    score_sillage:  score_sillage  ?? null,
    is_positive:    is_positive    ?? null,
    session_id:     session_id     ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fragrance_id = searchParams.get('fragrance_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
  const filter = searchParams.get('filter') ?? 'popular'

  if (!fragrance_id) return NextResponse.json({ error: 'fragrance_id required' }, { status: 400 })

  const supabase = createServiceClient()
  let q = supabase
    .from('fragrance_statements')
    .select('id, body, score_scent, score_longevity, score_sillage, is_positive, created_at')
    .eq('fragrance_id', fragrance_id)
    .limit(limit)

  if (filter === 'positive')  q = q.eq('is_positive', true)
  if (filter === 'negative')  q = q.eq('is_positive', false)
  if (filter === 'latest')    q = q.order('created_at', { ascending: false })
  else                        q = q.order('created_at', { ascending: false })

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
