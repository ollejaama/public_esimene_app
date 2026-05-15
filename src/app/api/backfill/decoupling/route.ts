import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { computeDecoupling, isEligibleForDecoupling } from '@/lib/analytics/decoupling'
import { effectiveDuration } from '@/lib/activity'

const BATCH_SIZE = 50

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createServiceClient()

  // Fetch all activities that could have decoupling but haven't been computed yet
  const { data: candidates, error } = await db
    .from('activities')
    .select('id, sport_type, custom_sport_tag, intensity_type, moving_time, elapsed_time')
    .eq('user_id', session.userId)
    .is('decoupling_percent', null)
    .eq('has_hr_data', true)
    .eq('has_gps_data', true)
    .limit(BATCH_SIZE)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!candidates || candidates.length === 0) return NextResponse.json({ processed: 0, updated: 0 })

  const eligible = candidates.filter((a) =>
    isEligibleForDecoupling(a.sport_type, a.custom_sport_tag)
  )

  let updated = 0

  for (const activity of eligible) {
    const [{ data: hrStream }, { data: gpsStream }] = await Promise.all([
      db.from('activity_hr_streams').select('hr_data').eq('activity_id', activity.id).maybeSingle(),
      db.from('activity_gps_streams').select('latlng_data').eq('activity_id', activity.id).maybeSingle(),
    ])

    if (!hrStream || !gpsStream) continue

    const activitySeconds = effectiveDuration(activity as any)
    const decoupling = computeDecoupling(hrStream.hr_data, gpsStream.latlng_data, activitySeconds)
    if (decoupling === null) continue

    await db.from('activities').update({ decoupling_percent: decoupling }).eq('id', activity.id)
    updated++
  }

  return NextResponse.json({ processed: candidates.length, updated })
}
