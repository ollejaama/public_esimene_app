import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { date: string } }
): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  await db
    .from('planned_rest_days')
    .delete()
    .eq('user_id', session.userId)
    .eq('date', params.date)

  return NextResponse.json({ ok: true })
}
