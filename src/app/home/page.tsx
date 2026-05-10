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
    .single()

  const sections = [
    {
      href: '/dashboard',
      title: 'Analyse',
      description: 'Review completed training — weekly summaries, HR zones, and activity history.',
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
