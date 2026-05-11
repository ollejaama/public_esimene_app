import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { setSessionCookie } from '@/lib/session'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const db = createServiceClient()
  const { data: profile } = await db.from('profiles').select('user_id').limit(1).single()

  if (!profile) {
    return NextResponse.redirect(new URL('/?error=no_athlete', _req.url))
  }

  const res = NextResponse.redirect(new URL('/activities', _req.url))
  await setSessionCookie(res, {
    userId: profile.user_id,
    stravaAthleteId: 0,
    role: 'coach',
  })
  return res
}
