// scripts/generate-descriptions.ts
// Replaces scraped boilerplate descriptions ("…Discover more details!") with
// short editorial copy grounded ONLY in data we hold: notes, accords,
// classification, and real Reddit sentiment. No invented facts.
//
// Targets Reddit-covered fragrances first (they have the richest context).
//
// Run:      npx tsx scripts/generate-descriptions.ts
// Dry run:  npx tsx scripts/generate-descriptions.ts --dry-run
// Limit:    npx tsx scripts/generate-descriptions.ts --limit=10

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = (() => {
  const f = process.argv.find(a => a.startsWith('--limit='))
  return f ? parseInt(f.split('=')[1], 10) : 200
})()

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'
const GROQ_KEY   = process.env.GROQ_API_KEY!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function generate(context: string): Promise<string | null> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content: `You write short fragrance descriptions for a UK fragrance database. Rules:
- 2 to 3 sentences, 40-70 words total. British English.
- Use ONLY the facts provided. Never invent launch years, perfumers, awards, or ingredients not listed.
- Describe what it smells like (from the notes/accords) and how it wears (from community data, if given).
- Plain, confident, specific. No marketing clichés ("elevate", "captivating", "masterpiece"), no exclamation marks, no "Discover".
- Do not start with the fragrance name. Vary sentence openings.
- Output only the description text, nothing else.`,
        },
        { role: 'user', content: context },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) return null
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = json.choices?.[0]?.message?.content?.trim()
  if (!text || text.length < 60 || text.length > 600) return null
  return text.replace(/^["']|["']$/g, '')
}

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no DB writes\n')

  // Reddit-covered fragrances first
  const { data: covered } = await supabase.from('fragrance_reddit_stats')
    .select('fragrance_id, mention_count, avg_score, avg_longevity, avg_sillage')
    .order('mention_count', { ascending: false })
  const ids = (covered ?? []).map(r => r.fragrance_id).slice(0, LIMIT)
  const redditMap = new Map((covered ?? []).map(r => [r.fragrance_id, r]))
  console.log(`${ids.length} Reddit-covered fragrances targeted`)

  let written = 0, failed = 0
  for (const id of ids) {
    const { data: f } = await supabase
      .from('fragrances')
      .select(`name, concentration, gender, year, fw_classification, description,
        brands(name), fragrance_accords(accord_name, percentage), fragrance_notes(position, notes(name))`)
      .eq('id', id)
      .single()
    if (!f) continue

    const brand = (f.brands as unknown as { name: string } | null)?.name ?? ''
    const accords = ((f.fragrance_accords ?? []) as Array<{ accord_name: string; percentage: number }>)
      .sort((a, b) => b.percentage - a.percentage).slice(0, 4).map(a => a.accord_name)
    const notes = ((f.fragrance_notes ?? []) as Array<{ position: string | null; notes: { name: string } | null }>)
      .map(n => n.notes?.name).filter(Boolean).slice(0, 10)
    const rs = redditMap.get(id)

    const lonLabel = rs?.avg_longevity ? ['very weak', 'weak', 'moderate', 'long-lasting', 'exceptional'][Math.min(4, Math.round(Number(rs.avg_longevity)) - 1)] : null
    const silLabel = rs?.avg_sillage ? ['very intimate', 'intimate', 'moderate', 'strong', 'room-filling'][Math.min(4, Math.round(Number(rs.avg_sillage)) - 1)] : null

    const context = [
      `Fragrance: ${f.name} by ${brand}`,
      f.concentration ? `Concentration: ${f.concentration}` : null,
      f.gender ? `Gender: ${f.gender}` : null,
      f.year ? `Launch year: ${f.year}` : null,
      f.fw_classification ? `Fragrance family: ${f.fw_classification}` : null,
      accords.length ? `Main accords: ${accords.join(', ')}` : null,
      notes.length ? `Notes: ${notes.join(', ')}` : null,
      rs ? `Community data from ${rs.mention_count} Reddit reviews: overall score ${rs.avg_score ?? 'n/a'}/10${lonLabel ? `, longevity rated ${lonLabel}` : ''}${silLabel ? `, sillage rated ${silLabel}` : ''}` : null,
    ].filter(Boolean).join('\n')

    process.stdout.write(`${f.name.slice(0, 40)} … `)
    const desc = await generate(context)
    if (!desc) { console.log('generation failed'); failed++; await sleep(1500); continue }

    if (DRY_RUN) {
      console.log(`\n  ${desc}\n`)
    } else {
      const { error } = await supabase.from('fragrances').update({ description: desc }).eq('id', id)
      if (error) { console.log(`db error: ${error.message}`); failed++ }
      else { console.log('ok'); written++ }
    }
    await sleep(1200)
  }
  console.log(`\nDone: ${written} written, ${failed} failed`)
}

main().catch(e => { console.error(e); process.exit(1) })
