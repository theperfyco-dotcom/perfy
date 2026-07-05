import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['owned','wishlist','worn','tried'] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { fragrance_id, status } = body
  if (!fragrance_id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase.from('user_collections').upsert({
    user_id: user.id, fragrance_id, status,
  }, { onConflict: 'user_id,fragrance_id,status' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fragrance_id = searchParams.get('fragrance_id')
  const status       = searchParams.get('status')

  if (!fragrance_id || !status) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { error } = await supabase.from('user_collections')
    .delete()
    .eq('user_id', user.id)
    .eq('fragrance_id', fragrance_id)
    .eq('status', status)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const fragrance_id = searchParams.get('fragrance_id')

  let q = supabase.from('user_collections').select('fragrance_id, status, created_at').eq('user_id', user.id)
  if (fragrance_id) q = q.eq('fragrance_id', fragrance_id)

  const { data } = await q
  return NextResponse.json(data ?? [])
}
