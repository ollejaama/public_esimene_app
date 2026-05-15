import { Activity } from '@/lib/supabase/types'

interface RPEWidgetProps {
  activities: Activity[]
  scale: 'rpe' | 'borg'
}

export function RPEWidget({ activities, scale }: RPEWidgetProps) {
  const withRpe = activities.filter((a) => a.rpe != null)
  if (withRpe.length === 0) {
    return (
      <div className="flex flex-col items-center py-3 px-2">
        <span className="text-xs text-gray-400">No RPE data</span>
      </div>
    )
  }

  const avg = withRpe.reduce((s, a) => s + a.rpe!, 0) / withRpe.length
  const label = scale === 'rpe' ? 'RPE (1–10)' : 'Borg (6–20)'

  // Group avg by sport
  const bySport = new Map<string, { sum: number; count: number }>()
  for (const a of withRpe) {
    const sport = a.sport_type ?? 'Other'
    const entry = bySport.get(sport) ?? { sum: 0, count: 0 }
    bySport.set(sport, { sum: entry.sum + a.rpe!, count: entry.count + 1 })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900 leading-none">{avg.toFixed(1)}</span>
        <span className="text-xs text-gray-400 mb-0.5">{label} avg · {withRpe.length} sessions</span>
      </div>
      {bySport.size > 1 && (
        <div className="space-y-1">
          {Array.from(bySport.entries()).map(([sport, { sum, count }]) => (
            <div key={sport} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{sport}</span>
              <span className="font-medium text-gray-800">{(sum / count).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
