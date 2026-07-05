import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.get('authorization')?.replace('Bearer ', '')
  const query  = req.nextUrl.searchParams.get('secret')
  return header === secret || query === secret
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  // Target month — default to last completed month
  const monthParam = req.nextUrl.searchParams.get('month') // e.g. "2026-06"
  const targetDate = monthParam
    ? new Date(`${monthParam}-01`)
    : (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d })()

  const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString()
  const monthEnd   = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1).toISOString()
  const awardMonth = monthStart.slice(0, 10) // YYYY-MM-DD

  // Pull all sentiments for the month
  const { data: rows, error } = await supabase
    .from('reddit_sentiments')
    .select('fragrance_id, sentiment_score, score_signal, longevity_signal, sillage_signal, price_value_signal, confidence')
    .gte('post_date', monthStart)
    .lt('post_date', monthEnd)
    .gte('confidence', 0.5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ message: 'no data for month', awardMonth })

  // Pull previous month for "rising" comparison
  const prevStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1).toISOString()
  const { data: prevRows } = await supabase
    .from('reddit_sentiments')
    .select('fragrance_id')
    .gte('post_date', prevStart)
    .lt('post_date', monthStart)
    .gte('confidence', 0.5)

  // Aggregate by fragrance
  const byFrag = new Map<string, {
    count: number; sentiments: number[]; scores: number[]
    longevity: number[]; sillage: number[]; priceValue: number[]
  }>()

  for (const r of rows) {
    if (!byFrag.has(r.fragrance_id)) {
      byFrag.set(r.fragrance_id, { count: 0, sentiments: [], scores: [], longevity: [], sillage: [], priceValue: [] })
    }
    const entry = byFrag.get(r.fragrance_id)!
    entry.count++
    if (r.sentiment_score  != null) entry.sentiments.push(Number(r.sentiment_score))
    if (r.score_signal     != null) entry.scores.push(r.score_signal)
    if (r.longevity_signal != null) entry.longevity.push(r.longevity_signal)
    if (r.sillage_signal   != null) entry.sillage.push(r.sillage_signal)
    if (r.price_value_signal != null) entry.priceValue.push(r.price_value_signal)
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b) / arr.length : null

  // Previous month counts per fragrance
  const prevCounts = new Map<string, number>()
  for (const r of prevRows ?? []) {
    prevCounts.set(r.fragrance_id, (prevCounts.get(r.fragrance_id) ?? 0) + 1)
  }

  // Build ranked lists per award type
  const entries = [...byFrag.entries()].map(([fragrance_id, d]) => ({
    fragrance_id,
    mention_count:  d.count,
    avg_sentiment:  avg(d.sentiments),
    avg_score:      avg(d.scores),
    avg_longevity:  avg(d.longevity),
    avg_sillage:    avg(d.sillage),
    avg_price:      avg(d.priceValue),
    prev_count:     prevCounts.get(fragrance_id) ?? 0,
    growth:         d.count - (prevCounts.get(fragrance_id) ?? 0),
  }))

  const withMin = (arr: typeof entries, minCount: number) =>
    arr.filter(e => e.mention_count >= minCount)

  const awards: Array<{
    fragrance_id: string; award_type: string
    mention_count: number; avg_sentiment: number | null; avg_score: number | null; detail: object
  }> = []

  const pick = (sorted: typeof entries, type: string, detail: (e: typeof entries[0]) => object) => {
    const winner = sorted[0]
    if (winner) awards.push({
      fragrance_id:  winner.fragrance_id,
      award_type:    type,
      mention_count: winner.mention_count,
      avg_sentiment: winner.avg_sentiment,
      avg_score:     winner.avg_score,
      detail:        detail(winner),
    })
  }

  // 🏆 Most Discussed
  pick(
    [...entries].sort((a, b) => b.mention_count - a.mention_count),
    'most_discussed',
    e => ({ mention_count: e.mention_count }),
  )
  // ⭐ Reddit's Favourite (highest sentiment, min 3 mentions)
  pick(
    [...withMin(entries, 3)].sort((a, b) => (b.avg_sentiment ?? -1) - (a.avg_sentiment ?? -1)),
    'reddit_favourite',
    e => ({ avg_sentiment: e.avg_sentiment, avg_score: e.avg_score }),
  )
  // 💎 Hidden Gem (high sentiment, low mention count — undiscovered)
  pick(
    [...entries]
      .filter(e => e.mention_count >= 2 && e.mention_count <= 8 && (e.avg_sentiment ?? 0) >= 0.4)
      .sort((a, b) => (b.avg_sentiment ?? 0) - (a.avg_sentiment ?? 0)),
    'hidden_gem',
    e => ({ avg_sentiment: e.avg_sentiment, mention_count: e.mention_count }),
  )
  // 🔥 Rising (biggest growth vs prior month)
  pick(
    [...entries].filter(e => e.growth > 0).sort((a, b) => b.growth - a.growth),
    'rising',
    e => ({ growth: e.growth, prev_count: e.prev_count, current_count: e.mention_count }),
  )
  // 💰 Best Value (highest price_value signal)
  pick(
    [...withMin(entries, 2)].filter(e => e.avg_price != null).sort((a, b) => (b.avg_price ?? 0) - (a.avg_price ?? 0)),
    'best_value',
    e => ({ avg_price_value: e.avg_price }),
  )
  // ⚡ Beast Mode (highest sillage)
  pick(
    [...withMin(entries, 2)].filter(e => e.avg_sillage != null).sort((a, b) => (b.avg_sillage ?? 0) - (a.avg_sillage ?? 0)),
    'beast_mode',
    e => ({ avg_sillage: e.avg_sillage }),
  )
  // ⏱️ Most Longevity
  pick(
    [...withMin(entries, 2)].filter(e => e.avg_longevity != null).sort((a, b) => (b.avg_longevity ?? 0) - (a.avg_longevity ?? 0)),
    'most_longevity',
    e => ({ avg_longevity: e.avg_longevity }),
  )

  // Upsert awards
  let inserted = 0
  for (const award of awards) {
    const { error: upsertErr } = await supabase
      .from('reddit_monthly_awards')
      .upsert({ ...award, award_month: awardMonth }, { onConflict: 'award_month,award_type' })
    if (!upsertErr) inserted++
  }

  return NextResponse.json({ ok: true, awardMonth, awards: awards.length, inserted })
}
