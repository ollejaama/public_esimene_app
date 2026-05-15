interface MonthlyVolumeWidgetProps {
  currentHours: number
  monthStart: Date
  monthEnd: Date
}

function fmtH(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function MonthlyVolumeWidget({ currentHours, monthStart, monthEnd }: MonthlyVolumeWidgetProps) {
  const today = new Date()
  const monthComplete = today >= monthEnd

  const daysElapsed = monthComplete
    ? Math.ceil((monthEnd.getTime() - monthStart.getTime()) / 86400000)
    : Math.max(1, Math.ceil((today.getTime() - monthStart.getTime()) / 86400000))

  const weeksElapsed = daysElapsed / 7
  const avgHoursPerWeek = weeksElapsed > 0 ? currentHours / weeksElapsed : 0

  const daysRemaining = monthComplete
    ? 0
    : Math.max(0, Math.ceil((monthEnd.getTime() - today.getTime()) / 86400000))

  const projectedTotal = currentHours + avgHoursPerWeek * (daysRemaining / 7)

  const projectedByLabel = new Date(monthEnd.getTime() - 86400000).toLocaleString('en-GB', {
    day: 'numeric', month: 'short',
  })

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* So far */}
      <div className="flex flex-col">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">
          {monthComplete ? 'Month total' : 'So far'}
        </p>
        <p className="text-xl font-semibold text-gray-800">{fmtH(currentHours)}</p>
        {!monthComplete && (
          <p className="text-[10px] text-gray-400 mt-0.5">{Math.round(avgHoursPerWeek * 10) / 10}h/week avg</p>
        )}
      </div>

      {/* Projected */}
      {!monthComplete && (
        <div className="flex flex-col">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">
            Projected by {projectedByLabel}
          </p>
          <p className="text-xl font-semibold text-gray-500">~{fmtH(projectedTotal)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">estimate</p>
        </div>
      )}
    </div>
  )
}
