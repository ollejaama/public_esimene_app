import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient, createSSRClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { displayName } = await req.json()
  if (!displayName?.trim()) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
  }

  const ssr = createSSRClient()

  if (session.role === 'coach') {
    // Coaches don't connect Strava, so create their profile row now
    const db = createServiceClient()
    const { error } = await db.from('profiles').upsert(
      {
        user_id: session.userId,
        display_name: displayName.trim(),
        role: 'coach',
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      console.error('Coach profile setup error:', error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }
  }

  // For athletes, store display_name in user metadata — the Strava callback creates the profile row
  await ssr.auth.updateUser({
    data: { has_profile: true, display_name: displayName.trim() },
  })

  return NextResponse.json({ success: true })
}
