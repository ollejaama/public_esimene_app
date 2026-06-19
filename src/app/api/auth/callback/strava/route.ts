import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/strava/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { createSSRClient } from '@/lib/supabase/server'

// Tables to migrate when an existing profile's user_id needs to change
const USER_SCOPED_TABLES = [
  'activities',
  'activity_hr_streams',
  'activity_gps_streams',
  'activity_laps',
  'planned_activities',
  'planned_rest_days',
  'training_camps',
  'hr_zone_settings',
  'user_settings',
  'illness_log',
  'lactate_measurements',
  'interval_sets',
] as const

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=strava_denied', req.url))
  }

  // Must be authenticated with Supabase Auth first
  const ssr = createSSRClient()
  const { data: { user } } = await ssr.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=not_authenticated', req.url))
  }

  try {
    const tokens = await exchangeCode(code)
    const db = createServiceClient()

    // Check if a profile already exists for this Strava athlete
    const { data: existing } = await db
      .from('profiles')
      .select('user_id')
      .eq('strava_athlete_id', tokens.athlete.id)
      .maybeSingle()

    // If existing data belongs to a different user_id, migrate it
    if (existing && existing.user_id !== user.id) {
      const oldUserId = existing.user_id
      for (const table of USER_SCOPED_TABLES) {
        await db
          .from(table)
          .update({ user_id: user.id })
          .eq('user_id', oldUserId)
      }
    }

    // Upsert profile linked to this Supabase Auth user
    const { error: upsertError } = await db.from('profiles').upsert(
      {
        user_id: user.id,
        strava_athlete_id: tokens.athlete.id,
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: tokens.expires_at,
        email: user.email,
        role: user.user_metadata?.role ?? 'athlete',
      },
      { onConflict: 'strava_athlete_id' }
    )

    if (upsertError) {
      console.error('Strava profile upsert error:', upsertError)
      return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
    }

    // Store strava_athlete_id in Supabase Auth user metadata
    await ssr.auth.updateUser({
      data: { strava_athlete_id: tokens.athlete.id },
    })

    return NextResponse.redirect(new URL('/home', req.url))
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}
