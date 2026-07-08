import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/providers/AuthProvider'
import AuthModal from '@/components/AuthModal'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Perfy — Fragrance Ratings & Discovery', template: '%s — Perfy' },
  description: 'Community ratings, scent profiles, dupe finder and price comparison for 4,000+ fragrances — powered by real Reddit reviews.',
  metadataBase: new URL('https://perfy.io'),
  openGraph: {
    siteName: 'Perfy',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <AuthProvider>
          <AuthModal />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
