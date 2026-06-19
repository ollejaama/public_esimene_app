import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Home — Training Analytics' }

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('profiles')
    .select('strava_athlete_id')
    .eq('user_id', session.userId)
    .maybeSingle()

  const sections = [
    {
      href: '/activities',
      title: 'Calendar',
      description: 'Browse completed training on a monthly calendar. Click any day to view details.',
    },
    {
      href: '/plan',
      title: 'Plan',
      description: 'Plan upcoming training week by week. Add, edit, and delete planned sessions.',
    },
    {
      href: '/compare',
      title: 'Compare',
      description: 'See planned training next to actual completed activities, side by side.',
    },
  ]

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Training Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Where would you like to go?</p>
      </div>

      {!profile?.strava_athlete_id && (
        <div className="mb-8 border border-atlas-rule bg-atlas-panel p-6" style={{ maxWidth: 480 }}>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted mb-2">
            Get started
          </p>
          <p className="font-serif text-[20px] leading-snug tracking-[-0.02em] text-atlas-ink mb-4">
            Connect Strava to sync your activities.
          </p>
          <a
            href="/api/auth/strava"
            className="inline-flex items-center font-sans text-[13px] font-semibold tracking-[0.04em] px-5 py-3 hover:opacity-85 transition-opacity"
            style={{ background: '#FC4C02', color: '#fff' }}
          >
            Connect with Strava →
          </a>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block border border-[#e5e5e5] rounded-lg p-6 hover:border-gray-400 hover:shadow-sm transition-all group"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-gray-700">
              {section.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">{section.description}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
