import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId } = session
  const db = createServiceClient()

  const { error } = await db.from('hr_zone_settings').upsert(
    {
      user_id: userId,
      zone1_max: body.zone1_max,
      zone2_max: body.zone2_max,
      zone3_max: body.zone3_max,
      zone4_max: body.zone4_max,
      zone1_name: body.zone1_name,
      zone2_name: body.zone2_name,
      zone3_name: body.zone3_name,
      zone4_name: body.zone4_name,
      zone5_name: body.zone5_name,
      rest_day_threshold_minutes: body.rest_day_threshold_minutes != null
        ? Number(body.rest_day_threshold_minutes)
        : 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
