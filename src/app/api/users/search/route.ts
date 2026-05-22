import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const db = createServiceClient()

  // Get IDs already linked to this coach to exclude from results
  const [{ data: directLinks }, { data: teams }] = await Promise.all([
    db.from('coach_athlete_links').select('athlete_id').eq('coach_id', session.userId),
    db.from('teams').select('id').eq('coach_id', session.userId),
  ])
  const teamIds = (teams ?? []).map((t) => t.id)
  const { data: teamMembers } = teamIds.length > 0
    ? await db.from('team_members').select('athlete_id').in('team_id', teamIds)
    : { data: [] as { athlete_id: string }[] }

  const excludedIds = new Set([
    session.userId,
    ...(directLinks ?? []).map((l) => l.athlete_id),
    ...(teamMembers ?? []).map((m) => m.athlete_id),
  ])

  // Search by display name
  const { data: profiles } = await db
    .from('user_profiles')
    .select('id, display_name, avatar_url')
    .eq('role', 'athlete')
    .ilike('display_name', `%${q}%`)
    .limit(20)

  const results = (profiles ?? [])
    .filter((p) => !excludedIds.has(p.id))
    .slice(0, 10)

  return NextResponse.json(results)
}
