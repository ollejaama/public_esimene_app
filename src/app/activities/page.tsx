import { AppShell } from '@/components/layout/AppShell'
import { ActivityCalendar } from '@/components/activities/ActivityCalendar'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Calendar — Training Analytics' }

export default async function ActivitiesPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const db = createServiceClient()
  const now = new Date()

  // Fetch current month + adjacent months for smooth navigation
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 1)

  const { data: activities } = await db
    .from('activities')
    .select('*')
    .eq('user_id', session.userId)
    .gte('start_date', start.toISOString())
    .lt('start_date', end.toISOString())
    .order('start_date', { ascending: true })

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
      </div>
      <ActivityCalendar
        activities={activities ?? []}
        initialMonth={new Date(now.getFullYear(), now.getMonth(), 1)}
      />
    </AppShell>
  )
}
