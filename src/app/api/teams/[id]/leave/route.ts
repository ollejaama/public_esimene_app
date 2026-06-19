import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'athlete') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = createServiceClient()
  await db
    .from('team_members')
    .update({ left_at: new Date().toISOString() })
    .eq('team_id', params.id)
    .eq('athlete_id', session.userId)
    .is('left_at', null)

  return NextResponse.json({ success: true })
}
