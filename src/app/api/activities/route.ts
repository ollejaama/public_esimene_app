import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sport_type, custom_sport_tag, date, time_of_day, duration_seconds, intensity_type, notes } = body

  if (!sport_type || !date || !duration_seconds) {
    return NextResponse.json({ error: 'sport_type, date, duration_seconds required' }, { status: 400 })
  }

  const durationSecs = Number(duration_seconds)
  if (isNaN(durationSecs) || durationSecs <= 0) {
    return NextResponse.json({ error: 'duration_seconds must be a positive number' }, { status: 400 })
  }

  // Derive start_date from date + time_of_day
  const hour = time_of_day === 'evening' ? 18 : 9
  const start_date = `${date}T${String(hour).padStart(2, '0')}:00:00`

  const db = createServiceClient()
  const { data, error } = await db
    .from('activities')
    .insert({
      user_id: session.userId,
      strava_id: null,
      name: '',
      sport_type,
      custom_sport_tag: custom_sport_tag ?? null,
      start_date,
      elapsed_time: durationSecs,
      moving_time: durationSecs,
      distance: 0,
      has_hr_data: false,
      has_gps_data: false,
      is_manual: true,
      notes: notes || null,
      intensity_type: intensity_type ?? 'regular',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
