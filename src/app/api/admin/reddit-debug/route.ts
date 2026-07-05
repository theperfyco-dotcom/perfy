import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const logs: string[] = []

  // 1. Check env vars
  logs.push(`GROQ_API_KEY set: ${!!process.env.GROQ_API_KEY}`)
  logs.push(`SUPABASE_SERVICE_ROLE_KEY set: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`)

  // 2. Fetch one fragrance from DB
  const supabase = createServiceClient()
  const { data: frags, error } = await supabase
    .from('fragrances').select('id, name, brands(name)').limit(1)
  logs.push(`DB fetch error: ${error?.message ?? 'none'}`)
  logs.push(`First fragrance: ${JSON.stringify(frags?.[0])}`)

  const frag = frags?.[0] as any
  const brand = frag?.brands?.name ?? ''
  const q = `${frag?.name ?? 'Aventus'} ${brand}`.trim()
  logs.push(`Search query: "${q}"`)

  // 3. Test Pullpush
  const after = Math.floor(Date.now() / 1000) - 1095 * 86400
  const ppUrl = `https://api.pullpush.io/reddit/search/submission/?subreddit=fragrance&q=${encodeURIComponent(q)}&after=${after}&size=5&sort=desc`
  logs.push(`Pullpush URL: ${ppUrl}`)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(ppUrl, { headers: { 'User-Agent': 'Perfy/1.0' }, signal: controller.signal })
    clearTimeout(timer)
    logs.push(`Pullpush status: ${res.status}`)
    const json = await res.json()
    logs.push(`Pullpush count: ${json.data?.length ?? 0}`)
    logs.push(`Pullpush error: ${json.error ?? 'none'}`)
    if (json.data?.[0]) logs.push(`First post: ${json.data[0].id} — ${json.data[0].title?.slice(0,50)}`)
  } catch (e: any) {
    logs.push(`Pullpush fetch error: ${e.message}`)
  }

  // 4. Test Reddit JSON
  const rjUrl = `https://www.reddit.com/r/fragrance/search.json?q=${encodeURIComponent(q)}&restrict_sr=true&sort=relevance&t=month&limit=5`
  logs.push(`Reddit JSON URL: ${rjUrl}`)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(rjUrl, { headers: { 'User-Agent': 'Perfy/1.0 (fragrance ratings aggregator)' }, signal: controller.signal })
    clearTimeout(timer)
    logs.push(`Reddit JSON status: ${res.status}`)
    const json = await res.json()
    const posts = json?.data?.children ?? []
    logs.push(`Reddit JSON count: ${posts.length}`)
    if (posts[0]) logs.push(`First post: ${posts[0].data?.id} — ${posts[0].data?.title?.slice(0,50)} (self: ${posts[0].data?.is_self})`)
  } catch (e: any) {
    logs.push(`Reddit JSON fetch error: ${e.message}`)
  }

  return NextResponse.json({ logs })
}
