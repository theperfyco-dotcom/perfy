import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fragrance_id } = await req.json()
  if (!fragrance_id) return NextResponse.json({ error: 'fragrance_id required' }, { status: 400 })

  const { error } = await createServiceClient()
    .from('wishlists')
    .upsert({ user_id: user.id, fragrance_id }, { onConflict: 'user_id,fragrance_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, wishlisted: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fragrance_id } = await req.json()
  const { error } = await createServiceClient()
    .from('wishlists')
    .delete()
    .eq('user_id', user.id)
    .eq('fragrance_id', fragrance_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, wishlisted: false })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ wishlisted: false })

  const fragrance_id = req.nextUrl.searchParams.get('fragrance_id')
  if (!fragrance_id) return NextResponse.json({ wishlisted: false })

  const { data } = await createServiceClient()
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('fragrance_id', fragrance_id)
    .maybeSingle()

  return NextResponse.json({ wishlisted: !!data })
}
