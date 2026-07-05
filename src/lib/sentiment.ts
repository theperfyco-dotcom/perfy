// Sentiment analysis via Groq (free tier — Llama 3.1 8B)
// Sign up at console.groq.com to get a free API key

export interface SentimentResult {
  score_signal:        number | null  // 1–10
  longevity_signal:    number | null  // 1–5
  sillage_signal:      number | null  // 1–5
  gender_signal:       number | null  // 1–5
  price_value_signal:  number | null  // 1–5
  sentiment_score:     number         // -1 to 1
  confidence:          number         // 0 to 1
}

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const SYSTEM = `You extract fragrance rating signals from Reddit posts. Return only valid JSON with no extra text.`

export async function analyseSentiment(
  text: string,
  fragranceName: string,
  brandName: string,
): Promise<SentimentResult | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) { console.warn('GROQ_API_KEY not set'); return null }

  const prompt = `Analyse this Reddit post about "${fragranceName}" by ${brandName}.

Text:
${text.slice(0, 2000)}

Return JSON with these fields (use null if not mentioned or unclear):
- score_signal: integer 1-10 (overall rating implied by the post)
- longevity_signal: integer 1-5 (1=barely there 2=weak 3=moderate 4=long-lasting 5=eternal)
- sillage_signal: integer 1-5 (1=skin scent 2=close 3=moderate 4=strong 5=beast mode)
- gender_signal: integer 1-5 (1=all female 2=mostly female 3=unisex 4=mostly male 5=all male)
- price_value_signal: integer 1-5 (1=way overpriced 2=overpriced 3=fair 4=good value 5=great value)
- sentiment_score: float -1.0 to 1.0 (overall tone of the post)
- confidence: float 0.0-1.0 (how sure are you this is genuinely reviewing this fragrance)

Return only JSON, no markdown.`

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        max_tokens:  256,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user',   content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.error('Groq error:', res.status, await res.text())
      return null
    }

    const json   = await res.json()
    const raw    = json.choices?.[0]?.message?.content?.trim() ?? ''
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed  = JSON.parse(cleaned) as SentimentResult

    const clamp = (v: unknown, min: number, max: number): number | null => {
      if (v === null || v === undefined) return null
      const n = Number(v)
      if (isNaN(n)) return null
      return Math.max(min, Math.min(max, Math.round(n)))
    }
    const clampF = (v: unknown, min: number, max: number): number => {
      const n = Number(v ?? 0)
      return isNaN(n) ? 0 : Math.max(min, Math.min(max, n))
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
  } catch (e) {
    console.error('sentiment error:', e)
    return null
  }
}
