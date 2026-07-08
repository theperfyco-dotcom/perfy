# Perfy — Monetisation & Search Growth Plan

_Last updated: 8 July 2026_

## Where the money comes from (in order of realism)

### Phase 1 — Affiliate links (now → first revenue)
1. **Amazon Associates UK** — already wired in code (`NEXT_PUBLIC_AMAZON_TAG`, buy panel,
   `rel="sponsored"`). Every fragrance page has an Amazon search link.
   *Chris action: confirm the Associates account is approved and the tag is set in
   Vercel env vars, not just `.env.local`. Amazon requires 3 qualifying sales in
   180 days to keep the account.*
2. **Awin network** (UK fragrance retailers: The Perfume Shop, Notino, LookFantastic,
   Fragrance Direct, AllBeauty) — apply once traffic is measurable (~1k visits/mo).
   These pay 5–12% vs Amazon's ~3% on beauty. Retailer links go in the buy panel via
   the `fragrance_prices` table with `affiliate_url`.
3. **eBay Partner Network** — good for discontinued/vintage fragrances that Amazon
   doesn't stock; fragrance collectors search for these heavily (low competition).

### Phase 2 — Price tracking as the moat (month 2–3)
- Populate `fragrance_prices` with real scraped/feed prices from affiliate feeds
  (Awin gives product feeds). "Best price for X" queries convert at the highest rate
  of anything in this niche and power the price-drop alert feature (already stubbed —
  "Track price drops" button). Price-drop emails = repeat visits = more clicks.

### Phase 3 — Later, once traffic exists
- **Sponsored placement** (clearly labelled) in dupe results / new-release slots.
- **Premium tier**: price-history charts, unlimited alerts, collection analytics.
- Never: display ads (kills the premium aesthetic and E-E-A-T), paid score changes.

## SEO / LLM-search strategy

### The thesis
Perfy's defensible content = **structured community data nobody else has**:
Reddit-derived scores, vote distributions, dupe similarity, seeded attribute ratings.
Fragrantica/Parfumo win on volume; Perfy wins on answering the *actual questions*:
"how long does X last", "is X worth it", "what smells like X but cheaper".

### Programmatic page types (live or shipped today)
| Page type | Count | Target query |
|---|---|---|
| `/fragrance/{slug}` | 4,057 | "{name} review / longevity / rating" |
| `/note/{name}` | 444 | "{note} fragrances", "perfumes with {note}" |
| `/brand/{slug}` | 449 | "{brand} fragrances ranked" |
| `/dupes?search=X` | ∞ | "{name} dupe / smells like {name}" |
| `/trending`, `/awards` | 2 | "reddit favourite fragrances {year}" |

Next content builds (highest SEO value first):
1. **Dupe landing pages** `/dupes/{slug}` (static, indexable, one per popular
   fragrance — "5 fragrances that smell like Aventus, ranked by accord match").
   Currently dupes are query-param only → not indexable.
2. **Longevity/value leaderboards** `/best/longevity`, `/best/value` etc. driven by
   perf-vote data — "longest lasting fragrances" is a huge query family.
3. Editorial answers on fragrance pages: 2–3 sentence AI-drafted, human-checked
   summary paragraph per top-100 fragrance (unique text content beyond data).

### Technical SEO (shipped today)
- ✅ Canonical domain fixed (was pointing at perfy.co — not our domain!)
- ✅ Sitemap: all fragrances, brands, 444 note pages, statics
- ✅ JSON-LD: Product + AggregateRating, BreadcrumbList, WebSite + SearchAction, Organization, CollectionPage
- ✅ Canonical URLs on fragrance/note/legal pages
- ✅ `llms.txt` for LLM crawlers (describes data + methodology)
- ✅ Trust pages: /about, /privacy, /terms, /affiliate-disclosure (E-E-A-T + network approvals)
- ✅ Dead links purged (note pills 404'd on every fragrance page)

### LLM-search (AEO) specifics
- Pages are server-rendered with data in plain HTML — LLM crawlers get everything.
- llms.txt describes the dataset and methodology.
- The Q&A card structure ("How long does it last?" → distribution) matches how
  people phrase LLM queries; keep question-phrased headings.
- robots.txt allows all agents (incl. GPTBot, ClaudeBot, PerplexityBot) — keep it that way.

### Chris's manual actions (can't be done from code)
1. **Google Search Console**: add perfy.io, verify via Vercel DNS, submit
   `https://perfy.io/sitemap.xml`. Same in **Bing Webmaster Tools** (feeds ChatGPT search).
2. **Amazon Associates**: confirm account + set `NEXT_PUBLIC_AMAZON_TAG` in Vercel
   env (Production) → redeploy.
3. **hello@perfy.io** mailbox (Zoho free tier) — it's now published on /about and llms.txt.
4. When traffic hits ~1k/mo: apply to **Awin** (needs the live site + disclosure page — done).
5. Optional but high-leverage: post genuinely useful dupe/longevity answers on
   r/fragrance linking Perfy only where relevant — that's where the audience is.

### KPIs (check monthly)
- Indexed pages (Search Console) → target: 4,500+ within 8 weeks
- Clicks on "where to buy" links (add Vercel Analytics event later)
- Affiliate EPC once Amazon reports arrive
