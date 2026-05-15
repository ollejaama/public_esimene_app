import { Activity } from '@/lib/supabase/types'

interface DecouplingWidgetProps {
  activities: Activity[]
}

const EXCLUDED_INTENSITIES = new Set(['interval', 'speed', 'competition'])

export function DecouplingWidget({ activities }: DecouplingWidgetProps) {
  const eligible = activities.filter(
    (a) => a.decoupling_percent != null && !EXCLUDED_INTENSITIES.has(a.intensity_type ?? '')
  )

  if (eligible.length === 0) {
    return (
      <div className="flex flex-col items-center py-3 px-2">
        <span className="text-xl font-semibold text-gray-300">—</span>
        <span className="text-xs mt-0.5 text-gray-400">no data</span>
      </div>
    )
  }

  const avg = eligible.reduce((s, a) => s + a.decoupling_percent!, 0) / eligible.length
  const [bg, text, label] = avg < 5
    ? ['bg-green-100', 'text-green-700', 'Good efficiency']
    : avg <= 8
    ? ['bg-yellow-100', 'text-yellow-700', 'Moderate']
    : ['bg-red-100', 'text-red-700', 'Significant']

  return (
    <div className="flex flex-col items-center py-3 px-2">
      <span className="text-xl font-semibold text-gray-700">{avg.toFixed(1)}%</span>
      <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full font-medium ${bg} ${text}`}>
        {label}
      </span>
      <span className="text-[10px] text-gray-400 mt-1">avg decoupling · {eligible.length} sessions</span>
    </div>
  )
}
