import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  fetchPullpushPosts, fetchRedditJsonPosts,
  filterPosts, postToText, SUBREDDITS,
} from '@/lib/reddit'
import { analyseSentiment } from '@/lib/sentiment'

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.get('authorization')?.replace('Bearer ', '')
  const query  = req.nextUrl.searchParams.get('secret')
  return header === secret || query === secret
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run(req)
}

export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return run(req)
}

async function run(req: NextRequest) {
  const supabase = createServiceClient()

  const targetId = req.nextUrl.searchParams.get('fragrance_id')
  // Route has maxDuration 60 (vercel.json) — 5 fragrances per tick fits
  const batchSize = targetId ? 1 : 5

  const query = supabase
    .from('fragrances')
    .select('id, name, brands(name)')
    .limit(batchSize)

  if (targetId) {
    query.eq('id', targetId)
  } else {
    // Only fragrances with images (proxy for "real product people actually
    // discuss" — filters catalogue junk), ordered by id so coverage spreads
    // across the catalogue instead of cycling the top of the alphabet.
    query.not('image_url', 'is', null).order('id')
    const { data: recent } = await supabase
      .from('reddit_sentiments')
      .select('fragrance_id')
      .gte('analyzed_at', new Date(Date.now() - 60 * 86400_000).toISOString())
    const recentIds = [...new Set((recent ?? []).map((r: any) => r.fragrance_id))]
    if (recentIds.length) query.not('id', 'in', `(${recentIds.join(',')})`)
  }

  const { data: fragrances, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!fragrances?.length) return NextResponse.json({ message: 'nothing to process' })

  const stats = { fragrances: 0, posts: 0, inserted: 0, skipped: 0, errors: 0, fetchErrors: [] as string[] }

  for (const frag of fragrances) {
    const brand = (frag.brands as any)?.name ?? ''
    const searchQ = `${frag.name} ${brand}`.trim()
    stats.fragrances++

    for (const sub of SUBREDDITS) {
      const [pp, rj] = await Promise.all([
        fetchPullpushPosts(searchQ, sub, 1095, 15),
        fetchRedditJsonPosts(searchQ, sub),
      ])

      if (pp.error) stats.fetchErrors.push(`[${sub}] Pullpush: ${pp.error}`)
      if (rj.error) stats.fetchErrors.push(`[${sub}] Reddit: ${rj.error}`)

      const posts = filterPosts([...pp.posts, ...rj.posts])
      stats.posts += posts.length

      for (const post of posts) {
        const { count } = await supabase
          .from('reddit_sentiments')
          .select('id', { count: 'exact', head: true })
          .eq('reddit_post_id', post.id)
          .is('reddit_comment_id', null)
        if ((count ?? 0) > 0) { stats.skipped++; continue }

        const text   = postToText(post)
        const result = await analyseSentiment(text, frag.name, brand)
        if (!result || result.confidence < 0.4) { stats.skipped++; continue }

        const { error: insErr } = await supabase.from('reddit_sentiments').insert({
          fragrance_id:      frag.id,
          reddit_post_id:    post.id,
          reddit_comment_id: null,
          subreddit:         post.subreddit,
          post_title:        post.title.slice(0, 300),
          body_text:         text.slice(0, 2000),
          author:            post.author,
          post_date:         new Date(post.created_utc * 1000).toISOString(),
          upvotes:           post.score,
          ...result,
        })

        if (insErr) {
          if (!insErr.code?.includes('23505')) stats.errors++
          stats.skipped++
        } else {
          stats.inserted++
        }

        await delay(200)
      }
    }

    await delay(300)
  }

  return NextResponse.json({ ok: true, stats })
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
