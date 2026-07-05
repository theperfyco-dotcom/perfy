/**
 * reddit-ingest.ts — subreddit-sweep approach
 *
 * Instead of searching per-fragrance (400+ API calls), we:
 *  1. Fetch recent posts from r/fragrance in bulk pages (~10 API calls)
 *  2. Match each post against our fragrance DB locally
 *  3. Analyse matched posts with Groq and insert
 *
 * Usage:
 *   npx tsx scripts/reddit-ingest.ts              # sweeps last 3 years
 *   npx tsx scripts/reddit-ingest.ts --days 30    # last 30 days only
 *   npx tsx scripts/reddit-ingest.ts --sub fragranceclones  # different subreddit
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.1-8b-instant'
const PULLPUSH     = 'https://api.pullpush.io/reddit/search'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Fetch subreddit posts in bulk pages ───────────────────────────────────────

async function fetchSubredditPage(subreddit: string, before: number, size = 100): Promise<any[]> {
  const url = `${PULLPUSH}/submission/?subreddit=${subreddit}&before=${before}&size=${size}&sort=desc&is_self=true`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Perfy/1.0' } })
    if (res.status === 429) { console.warn(`  rate limited — waiting 60s`); await sleep(60000); return [] }
    if (!res.ok) { console.warn(`  Pullpush ${res.status}`); return [] }
    const json = await res.json()
    return (json.data ?? [])
      .filter((p: any) => (p.selftext ?? '').length > 80)
      .filter((p: any) => !['[deleted]', '[removed]'].includes(p.selftext))
  } catch (e: any) {
    console.warn(`  fetch error: ${e.message}`)
    return []
  }
}

// ── Build fragrance name index from DB ───────────────────────────────────────

interface FragranceEntry { id: string; name: string; brand: string; terms: string[] }

async function buildFragranceIndex(): Promise<FragranceEntry[]> {
  const { data, error } = await supabase
    .from('fragrances')
    .select('id, name, brands(name)')
  if (error) { console.error('DB error:', error.message); process.exit(1) }
  return (data ?? []).map((f: any) => {
    const brand = f.brands?.name ?? ''
    const name  = f.name ?? ''
    // Build search terms: full name, name without brand prefix, key words
    const terms = [
      `${name} ${brand}`.toLowerCase(),
      name.toLowerCase(),
      brand.toLowerCase(),
    ].filter(Boolean)
    return { id: f.id, name, brand, terms }
  })
}

// Match a post against our fragrance index — returns best match
function matchFragrance(post: any, index: FragranceEntry[]): FragranceEntry | null {
  const text = `${post.title ?? ''} ${post.selftext ?? ''}`.toLowerCase()
  let best: FragranceEntry | null = null
  let bestLen = 0

  for (const frag of index) {
    for (const term of frag.terms) {
      if (term.length < 4) continue // skip very short names
      if (text.includes(term) && term.length > bestLen) {
        best    = frag
        bestLen = term.length
      }
    }
  }
  return best
}

// ── Groq sentiment ────────────────────────────────────────────────────────────

async function analyseSentiment(text: string, fragranceName: string, brandName: string) {
  if (!GROQ_API_KEY) { console.warn('GROQ_API_KEY not set'); return null }

  const prompt = `Analyse this Reddit post about "${fragranceName}" by ${brandName}.

Text:
${text.slice(0, 2000)}

Return JSON with these fields (use null if not mentioned or unclear):
- score_signal: integer 1-10 (overall rating implied by the post)
- longevity_signal: integer 1-5 (1=barely there 5=eternal)
- sillage_signal: integer 1-5 (1=skin scent 5=beast mode)
- gender_signal: integer 1-5 (1=all female 3=unisex 5=all male)
- price_value_signal: integer 1-5 (1=way overpriced 5=great value)
- sentiment_score: float -1.0 to 1.0 (overall tone)
- confidence: float 0.0-1.0 (how sure this genuinely reviews this fragrance)

Return only JSON, no markdown.`

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 256, temperature: 0.1,
          messages: [
            { role: 'system', content: 'You extract fragrance rating signals from Reddit posts. Return only valid JSON.' },
            { role: 'user',   content: prompt },
          ],
        }),
      })
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}))
        const retryMatch = body?.error?.message?.match(/try again in ([\d.]+)s/)
        const waitSecs   = retryMatch ? parseFloat(retryMatch[1]) + 0.5 : 10
        console.log(`  Groq rate limit — waiting ${waitSecs.toFixed(1)}s`)
        await sleep(waitSecs * 1000)
        continue
      }
      if (!res.ok) { console.warn(`  Groq ${res.status}`); return null }

      const json    = await res.json()
      const raw     = json.choices?.[0]?.message?.content?.trim() ?? ''
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*?\}(?=\s*$|\s*\n[^{])/) ?? cleaned.match(/\{[\s\S]*\}/)
      const parsed  = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned)

      const clamp  = (v: unknown, mn: number, mx: number) => {
        if (v === null || v === undefined) return null
        const n = Number(v); if (isNaN(n)) return null
        return Math.max(mn, Math.min(mx, Math.round(n)))
      }
      const clampF = (v: unknown, mn: number, mx: number) => {
        const n = Number(v ?? 0); return isNaN(n) ? 0 : Math.max(mn, Math.min(mx, n))
      }
      return {
        score_signal:       clamp(parsed.score_signal, 1, 10),
        longevity_signal:   clamp(parsed.longevity_signal, 1, 5),
        sillage_signal:     clamp(parsed.sillage_signal, 1, 5),
        gender_signal:      clamp(parsed.gender_signal, 1, 5),
        price_value_signal: clamp(parsed.price_value_signal, 1, 5),
        sentiment_score:    clampF(parsed.sentiment_score, -1, 1),
        confidence:         clampF(parsed.confidence, 0, 1),
      }
    } catch (e: any) {
      return null
    }
  }
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2)
  const daysArg = args.includes('--days') ? parseInt(args[args.indexOf('--days') + 1]) : 1095
  const sub     = args.includes('--sub')  ? args[args.indexOf('--sub') + 1] : 'fragrance'
  const maxPages = args.includes('--pages') ? parseInt(args[args.indexOf('--pages') + 1]) : 10

  const afterTs = Math.floor(Date.now() / 1000) - daysArg * 86400

  console.log(`\nPerfy Reddit Sweep — ${new Date().toISOString()}`)
  console.log(`Subreddit: r/${sub} | Last ${daysArg} days | Up to ${maxPages} pages of 100 posts\n`)

  console.log('Building fragrance index from DB...')
  const index = await buildFragranceIndex()
  console.log(`  ${index.length} fragrances indexed\n`)

  // Fetch known post IDs to skip already-processed
  console.log('Loading already-processed post IDs...')
  const { data: existing } = await supabase
    .from('reddit_sentiments')
    .select('reddit_post_id')
  const processedIds = new Set((existing ?? []).map((r: any) => r.reddit_post_id))
  console.log(`  ${processedIds.size} posts already in DB\n`)

  const stats = { pages: 0, posts: 0, matched: 0, inserted: 0, skipped: 0, errors: 0 }
  let before = Math.floor(Date.now() / 1000)

  for (let page = 0; page < maxPages; page++) {
    console.log(`── Page ${page + 1}/${maxPages} (before: ${new Date(before * 1000).toISOString().slice(0,10)})`)
    const posts = await fetchSubredditPage(sub, before, 100)
    stats.pages++

    if (!posts.length) {
      console.log('  No posts returned — done.')
      break
    }

    // Stop if we've gone past our time window
    const oldest = posts[posts.length - 1]?.created_utc ?? 0
    if (oldest < afterTs) {
      console.log(`  Reached ${daysArg}-day limit — done.`)
      break
    }

    // Set before to oldest post timestamp for next page
    before = oldest - 1
    await sleep(12000) // 12s between pages to respect rate limit

    for (const post of posts) {
      stats.posts++

      if (processedIds.has(post.id)) { stats.skipped++; continue }

      const frag = matchFragrance(post, index)
      if (!frag) continue
      stats.matched++

      const text   = `${post.title}\n\n${post.selftext}`.slice(0, 2500)
      const result = await analyseSentiment(text, frag.name, frag.brand)

      if (!result || result.confidence < 0.4) { stats.skipped++; continue }

      const { error: insErr } = await supabase.from('reddit_sentiments').insert({
        fragrance_id:      frag.id,
        reddit_post_id:    post.id,
        reddit_comment_id: null,
        subreddit:         sub,
        post_title:        (post.title ?? '').slice(0, 300),
        body_text:         text.slice(0, 2000),
        author:            post.author ?? '',
        post_date:         new Date(post.created_utc * 1000).toISOString(),
        upvotes:           post.score ?? 0,
        ...result,
      })

      if (insErr) {
        if (insErr.code?.includes('23505')) { stats.skipped++; continue }
        stats.errors++
      } else {
        processedIds.add(post.id)
        stats.inserted++
        console.log(`  ✓ [${frag.name}] ${post.title.slice(0, 55)} [score:${result.score_signal} conf:${result.confidence.toFixed(2)}]`)
      }

      await sleep(5000) // 5s between Groq calls
    }
  }

  console.log('\n── Summary ──────────────────────')
  console.log(`  Pages fetched : ${stats.pages}`)
  console.log(`  Posts scanned : ${stats.posts}`)
  console.log(`  Matched frags : ${stats.matched}`)
  console.log(`  Inserted      : ${stats.inserted}`)
  console.log(`  Skipped       : ${stats.skipped}`)
  console.log(`  Errors        : ${stats.errors}`)
  console.log('─────────────────────────────────\n')
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

main().catch(e => { console.error(e); process.exit(1) })
