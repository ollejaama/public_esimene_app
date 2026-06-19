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

  const db = createServiceClient()
  const { error } = await db.from('profiles').upsert(
    {
      user_id: session.userId,
      display_name: displayName.trim(),
      role: session.role,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Profile setup error:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  // Mark profile as created in user metadata so middleware stops redirecting to /onboarding
  const ssr = createSSRClient()
  await ssr.auth.updateUser({ data: { has_profile: true } })

  return NextResponse.json({ success: true })
}
