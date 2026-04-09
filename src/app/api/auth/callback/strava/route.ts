import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { exchangeCode } from '@/lib/strava/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { setSessionCookie } from '@/lib/session'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=strava_denied', req.url))
  }

  try {
    const tokens = await exchangeCode(code)
    const db = createServiceClient()

    // Check if this athlete already has a profile
    const { data: existing } = await db
      .from('profiles')
      .select('user_id')
      .eq('strava_athlete_id', tokens.athlete.id)
      .single()

    const userId = existing?.user_id ?? uuidv4()

    // Upsert profile
    await db.from('profiles').upsert(
      {
        user_id: userId,
        strava_athlete_id: tokens.athlete.id,
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: tokens.expires_at,
      },
      { onConflict: 'strava_athlete_id' }
    )

    const res = NextResponse.redirect(new URL('/dashboard', req.url))
    await setSessionCookie(res, { userId, stravaAthleteId: tokens.athlete.id })
    return res
  } catch (err) {
    console.error('Strava callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}
