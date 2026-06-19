import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = createServiceClient()

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    db
      .from('notifications')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.userId)
      .eq('read', false),
  ])

  return NextResponse.json({ notifications: notifications ?? [], unreadCount: unreadCount ?? 0 })
}
