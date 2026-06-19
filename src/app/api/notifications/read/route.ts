import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = createServiceClient()
  await db
    .from('notifications')
    .update({ read: true })
    .eq('user_id', session.userId)
    .eq('read', false)

  return NextResponse.json({ success: true })
}
