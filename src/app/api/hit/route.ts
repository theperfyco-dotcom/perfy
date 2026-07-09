import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// First-party page-view counter. No cookies, no IP, no user agent stored —
// just the path and the referrer's host, enough to measure the weekly-visits
// goal and see which channels convert.

export async function POST(req: NextRequest) {
  try {
    const { path, ref } = await req.json() as { path?: string; ref?: string }
    if (!path || typeof path !== 'string' || path.length > 200) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    let refHost: string | null = null
    if (ref && typeof ref === 'string') {
      try { refHost = new URL(ref).hostname.slice(0, 100) } catch { /* ignore bad referrers */ }
    }
    if (refHost === 'perfy.io' || refHost === 'localhost') refHost = null // internal nav

    const supabase = createServiceClient()
    await supabase.from('page_views').insert({ path: path.slice(0, 200), ref_host: refHost })
  } catch { /* counting is best-effort — never break the page */ }
  return NextResponse.json({ ok: true })
}
