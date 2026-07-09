import { ImageResponse } from 'next/og'
import { getFragranceBySlug, getRedditStats } from '@/lib/db'
import { getAccordColor } from '@/lib/accord-colors'

export const runtime = 'nodejs'
export const alt = 'Fragrance details on Perfy'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const fragrance = await getFragranceBySlug(slug)

  if (!fragrance) {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', fontSize: 64 }}>
        Perfy
      </div>,
      size,
    )
  }

  const redditStats = await getRedditStats(fragrance.id)
  const score = fragrance.avg_score ?? redditStats?.avg_score ?? null
  const scoreSource = fragrance.avg_score ? 'community score' : 'Reddit score'
  const accords = [...(fragrance.accords ?? [])].sort((a, b) => b.percentage - a.percentage).slice(0, 5)
  const accordTotal = accords.reduce((s, a) => s + a.percentage, 0) || 1

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#FFFFFF', color: '#1C1917', fontFamily: 'serif', position: 'relative',
      }}>
        {/* Accord colour strip across the top */}
        <div style={{ display: 'flex', height: 18, width: '100%' }}>
          {accords.length > 0 ? accords.map(a => (
            <div key={a.name} style={{
              width: `${(a.percentage / accordTotal) * 100}%`,
              background: a.color_hex ?? getAccordColor(a.name),
            }} />
          )) : <div style={{ width: '100%', background: '#E5E3DC' }} />}
        </div>

        <div style={{ display: 'flex', flex: 1, padding: '56px 72px', alignItems: 'center', gap: 64 }}>
          {/* Bottle */}
          {fragrance.image_url && (
            <div style={{
              display: 'flex', width: 320, height: 420, alignItems: 'center', justifyContent: 'center',
              background: '#F9F8F6', borderRadius: 12, border: '1px solid #E5E3DC',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fragrance.image_url} alt="" width={280} height={380} style={{ objectFit: 'contain' }} />
            </div>
          )}

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: '#78716C', marginBottom: 12 }}>
              {fragrance.brand.name}
            </div>
            <div style={{ fontSize: fragrance.name.length > 24 ? 52 : 66, lineHeight: 1.05, marginBottom: 28, fontWeight: 500 }}>
              {fragrance.name}
            </div>

            {score && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 84, fontWeight: 600 }}>{score.toFixed(1)}</div>
                <div style={{ fontSize: 32, color: '#A8A29E' }}>/10</div>
                <div style={{ fontSize: 24, color: '#78716C', marginLeft: 8 }}>{scoreSource}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {accords.slice(0, 3).map(a => (
                <div key={a.name} style={{
                  display: 'flex', fontSize: 22, padding: '8px 20px', borderRadius: 4,
                  background: '#F9F8F6', border: '1px solid #E5E3DC', color: '#44403C',
                }}>
                  {a.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 72px 40px',
        }}>
          <div style={{ fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>PERFY</div>
          <div style={{ fontSize: 22, color: '#78716C' }}>Community fragrance ratings — perfy.io</div>
        </div>
      </div>
    ),
    size,
  )
}
