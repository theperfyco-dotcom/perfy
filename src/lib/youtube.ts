import { createServiceClient } from './supabase/server'

export interface YouTubeVideo {
  videoId:   string
  title:     string
  channel:   string
  thumbnail: string
  published: string
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function getYouTubeReviews(
  fragranceId: string,
  fragranceName: string,
  brandName: string,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  const supabase = createServiceClient()

  // Check cache first
  const { data: cached } = await supabase
    .from('youtube_cache')
    .select('videos, cached_at')
    .eq('fragrance_id', fragranceId)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.cached_at).getTime()
    if (age < CACHE_TTL_MS) return cached.videos as YouTubeVideo[]
  }

  // Fetch fresh from YouTube
  const q = encodeURIComponent(`${fragranceName} ${brandName} fragrance review`)
  const endpoint =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet&q=${q}&type=video&maxResults=6` +
    `&relevanceLanguage=en&order=relevance&key=${apiKey}`

  try {
    const res = await fetch(endpoint, { next: { revalidate: 0 } })
    if (!res.ok) return (cached?.videos ?? []) as YouTubeVideo[]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as { items?: any[] }
    const videos: YouTubeVideo[] = (json.items ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.id?.videoId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        videoId:   item.id.videoId as string,
        title:     item.snippet.title as string,
        channel:   item.snippet.channelTitle as string,
        thumbnail: (item.snippet.thumbnails?.medium?.url
                 ?? item.snippet.thumbnails?.default?.url
                 ?? '') as string,
        published: item.snippet.publishedAt as string,
      }))

    // Upsert cache
    await supabase.from('youtube_cache').upsert(
      { fragrance_id: fragranceId, videos, cached_at: new Date().toISOString() },
      { onConflict: 'fragrance_id' },
    )

    return videos
  } catch {
    return (cached?.videos ?? []) as YouTubeVideo[]
  }
}
