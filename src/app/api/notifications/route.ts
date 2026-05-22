import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()

  const [{ data: all }, { count }] = await Promise.all([
    db.from('notifications')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(30),
    db.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.userId)
      .is('read_at', null),
  ])

  return NextResponse.json({ notifications: all ?? [], unreadCount: count ?? 0 })
}
