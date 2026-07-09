'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Fires one count per client-side route view. Cookieless; see /api/hit.
export default function PageView() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    lastPath.current = pathname
    const ref = lastPath.current && document.referrer ? document.referrer : ''
    fetch('/api/hit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, ref }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
