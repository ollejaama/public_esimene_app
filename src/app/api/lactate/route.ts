import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'

// Returns daily averages for lactate measurements within a date range
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')

  const db = createServiceClient()

  // Fetch measurements joined with activity start_date for date grouping
  let query = db
    .from('lactate_measurements')
    .select('value_mmol, activities!inner(start_date)')
    .eq('user_id', session.userId)

  if (start) query = (query as any).gte('activities.start_date', start)
  if (end)   query = (query as any).lt('activities.start_date', end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by date (YYYY-MM-DD) and compute daily averages
  const byDate = new Map<string, number[]>()
  for (const row of (data ?? []) as any[]) {
    const date = (row.activities?.start_date ?? '').slice(0, 10)
    if (!date) continue
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push(row.value_mmol)
  }

  const result = Array.from(byDate.entries())
    .map(([date, vals]) => ({
      date,
      avg_mmol: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json(result)
}
