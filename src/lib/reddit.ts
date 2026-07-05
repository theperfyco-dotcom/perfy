// Reddit data fetching — Pullpush.io (history) + Reddit JSON (recent)

const SUBREDDITS = ['fragrance', 'MaleFragranceAdvice', 'FemaleFragranceAdvice', 'fragranceclones']
const PULLPUSH   = 'https://api.pullpush.io/reddit/search'
const REDDIT_JSON = 'https://www.reddit.com'

export interface RedditPost {
  id:        string
  subreddit: string
  title:     string
  selftext:  string
  author:    string
  created_utc: number
  score:     number
  is_self:   boolean
}

export interface RedditComment {
  id:          string
  post_id:     string
  subreddit:   string
  body:        string
  author:      string
  created_utc: number
  score:       number
}

// Fetch posts from Pullpush (3-year history)
export async function fetchPullpushPosts(
  query: string,
  subreddit: string,
  afterDays = 1095, // 3 years
  size = 25,
): Promise<{ posts: RedditPost[]; error?: string }> {
  const after = Math.floor(Date.now() / 1000) - afterDays * 86400
  const url = `${PULLPUSH}/submission/?subreddit=${encodeURIComponent(subreddit)}&q=${encodeURIComponent(query)}&after=${after}&size=${size}&sort=desc&is_self=true`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Perfy/1.0' }, signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return { posts: [], error: `Pullpush ${res.status}` }
    const json = await res.json()
    const posts = (json.data ?? []).map((p: any) => ({
      id:          p.id,
      subreddit:   p.subreddit,
      title:       p.title ?? '',
      selftext:    p.selftext ?? '',
      author:      p.author ?? '',
      created_utc: p.created_utc,
      score:       p.score ?? 0,
      is_self:     true,
    }))
    return { posts }
  } catch (e: any) {
    clearTimeout(timer)
    return { posts: [], error: `Pullpush fetch error: ${e.message}` }
  }
}

// Fetch recent posts from Reddit JSON API (last month, no auth needed)
export async function fetchRedditJsonPosts(query: string, subreddit: string): Promise<{ posts: RedditPost[]; error?: string }> {
  // Note: no &type=link — we want self (text) posts, which Reddit JSON returns by default for search
  const url = `${REDDIT_JSON}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=true&sort=relevance&t=year&limit=25`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Perfy/1.0 (fragrance ratings aggregator)' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return { posts: [], error: `Reddit JSON ${res.status}` }
    const json = await res.json()
    const posts = (json?.data?.children ?? [])
      .filter((c: any) => c?.data?.is_self && (c?.data?.selftext?.length ?? 0) > 80)
      .map((c: any) => ({
        id:          c.data.id,
        subreddit,
        title:       c.data.title ?? '',
        selftext:    c.data.selftext ?? '',
        author:      c.data.author ?? '',
        created_utc: c.data.created_utc,
        score:       c.data.score ?? 0,
        is_self:     true,
      }))
    return { posts }
  } catch (e: any) {
    clearTimeout(timer)
    return { posts: [], error: `Reddit JSON fetch error: ${e.message}` }
  }
}

// Fetch comments for a post from Pullpush
export async function fetchPullpushComments(postId: string, subreddit: string): Promise<RedditComment[]> {
  const url = `${PULLPUSH}/comment/?link_id=${postId}&subreddit=${encodeURIComponent(subreddit)}&size=20&sort=desc`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Perfy/1.0' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? [])
      .filter((c: any) => (c.body ?? '').length > 60)
      .map((c: any) => ({
        id:          c.id,
        post_id:     postId,
        subreddit,
        body:        c.body ?? '',
        author:      c.author ?? '',
        created_utc: c.created_utc,
        score:       c.score ?? 0,
      }))
  } catch { return [] }
}

// Deduplicate and filter: min 80 chars of useful text, not deleted/removed
export function filterPosts(posts: RedditPost[]): RedditPost[] {
  const seen = new Set<string>()
  return posts.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    const text = `${p.title} ${p.selftext}`.trim()
    if (text.length < 80) return false
    if (['[deleted]', '[removed]'].includes(p.selftext)) return false
    return true
  })
}

// Build the text to analyse for a post
export function postToText(post: RedditPost): string {
  return `${post.title}\n\n${post.selftext}`.slice(0, 2500)
}

// All subreddits to search
export { SUBREDDITS }
