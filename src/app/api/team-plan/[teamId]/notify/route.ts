import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPlanNotificationEmail } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()

  const { data: team } = await db
    .from('teams')
    .select('name')
    .eq('id', params.teamId)
    .eq('coach_id', session.userId)
    .maybeSingle()

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const { data: coachProfile } = await db
    .from('user_profiles')
    .select('display_name')
    .eq('id', session.userId)
    .single()
  const coachName = coachProfile?.display_name ?? 'Your coach'

  const { data: members } = await db
    .from('team_members')
    .select('athlete_id')
    .eq('team_id', params.teamId)

  if (!members?.length) return NextResponse.json({ notified: 0 })

  const athleteIds = members.map((m) => m.athlete_id)

  // Create in-app notifications for all athletes
  const notifications = athleteIds.map((athleteId) => ({
    user_id: athleteId,
    type: 'team_plan_updated',
    payload: {
      coachId: session.userId,
      coachName,
      teamId: params.teamId,
      teamName: team.name,
    },
  }))
  await db.from('notifications').insert(notifications)

  // Send emails
  const { data: authUsers } = await db.auth.admin.listUsers()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atlas.training'
  let emailsSent = 0

  for (const athleteId of athleteIds) {
    const authUser = authUsers?.users?.find((u) => u.id === athleteId)
    if (authUser?.email) {
      try {
        await sendPlanNotificationEmail(authUser.email, coachName, team.name, appUrl)
        emailsSent++
      } catch {
        // Continue even if one email fails
      }
    }
  }

  return NextResponse.json({ notified: athleteIds.length, emailsSent })
}
