import type { Metadata } from 'next'
import { Newsreader, Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Training Analytics',
  description: 'Personal training analytics powered by Strava',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let theme: 'light' | 'dark' = 'light'

  const session = await getSession()
  if (session) {
    const db = createServiceClient()
    const { data } = await db
      .from('user_settings')
      .select('theme')
      .eq('user_id', session.userId)
      .maybeSingle()
    if (data?.theme === 'dark') theme = 'dark'
  }

  return (
    <html
      lang="en"
      data-atlas-theme={theme}
      className={`${newsreader.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased font-sans bg-atlas-bg text-atlas-ink">
        {children}
      </body>
    </html>
  )
}
