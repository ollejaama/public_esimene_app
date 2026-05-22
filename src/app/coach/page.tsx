import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AppShell } from '@/components/layout/AppShell'
import { CoachDashboard } from '@/components/coach/CoachDashboard'
import { getCoachAthletes, getCoachTeams, getPendingInvitesByCoach } from '@/lib/coach'

export const metadata = { title: 'Coach — Atlas' }

export default async function CoachPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/activities')

  const [athletes, teams, pendingInvites] = await Promise.all([
    getCoachAthletes(session.userId),
    getCoachTeams(session.userId),
    getPendingInvitesByCoach(session.userId),
  ])

  return (
    <AppShell>
      <CoachDashboard
        athletes={athletes}
        teams={teams}
        pendingInvites={pendingInvites}
      />
    </AppShell>
  )
}
