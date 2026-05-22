import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { exchangeCode } from '@/lib/strava/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { setSessionCookie, getSessionFromRequest } from '@/lib/session'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state') ?? ''

  if (error || !code) {
    return NextResponse.redirect(new URL('/onboarding/strava?error=strava_denied', req.url))
  }

  try {
    const tokens = await exchangeCode(code)
    const db = createServiceClient()

    // Prefer the logged-in user's ID (new multi-user flow).
    // Fall back to legacy UUID generation for Strava-only users.
    const session = await getSessionFromRequest(req)

    let userId: string
    let needsSessionCookie = false

    if (session) {
      userId = session.userId
    } else {
      const { data: existing } = await db
        .from('profiles')
        .select('user_id')
        .eq('strava_athlete_id', tokens.athlete.id)
        .maybeSingle()
      userId = existing?.user_id ?? uuidv4()
      needsSessionCookie = true
    }

    // If another profile row already holds this strava_athlete_id (e.g. from a
    // deleted/legacy account), remove it first so the unique constraint doesn't
    // block the upsert.  Cascade-delete removes its activities automatically.
    await db
      .from('profiles')
      .delete()
      .eq('strava_athlete_id', tokens.athlete.id)
      .neq('user_id', userId)

    await db.from('profiles').upsert(
      {
        user_id: userId,
        strava_athlete_id: tokens.athlete.id,
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: tokens.expires_at,
      },
      { onConflict: 'user_id' }
    )

    const redirectTo = state || '/settings'
    const res = NextResponse.redirect(new URL(redirectTo, req.url))

    if (needsSessionCookie) {
      await setSessionCookie(res, { userId, stravaAthleteId: tokens.athlete.id, role: 'athlete' })
    }

    return res
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL('/onboarding/strava?error=auth_failed', req.url))
  }
}
