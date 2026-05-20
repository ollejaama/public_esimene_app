interface SeasonalVolumeWidgetProps {
  currentHours: number
  seasonStart: Date
  seasonEnd: Date
  prevSeasonHours: number | null
}

function fmtH(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function SeasonalVolumeWidget({ currentHours, seasonStart, seasonEnd, prevSeasonHours }: SeasonalVolumeWidgetProps) {
  const today = new Date()
  const seasonComplete = today >= seasonEnd

  const daysTotal = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / 86400000)
  const daysElapsed = seasonComplete
    ? daysTotal
    : Math.max(1, Math.ceil((today.getTime() - seasonStart.getTime()) / 86400000))

  const weeksElapsed = daysElapsed / 7
  const avgHoursPerWeek = weeksElapsed > 0 ? currentHours / weeksElapsed : 0

  const daysRemaining = seasonComplete
    ? 0
    : Math.max(0, Math.ceil((seasonEnd.getTime() - today.getTime()) / 86400000))

  const projectedTotal = currentHours + avgHoursPerWeek * (daysRemaining / 7)

  const prevDelta = prevSeasonHours != null && prevSeasonHours > 0
    ? Math.round(((projectedTotal - prevSeasonHours) / prevSeasonHours) * 100)
    : null

  return (
    <div className="grid grid-cols-3 gap-6">
      <div>
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted mb-1">
          {seasonComplete ? 'Season total' : 'So far'}
        </p>
        <p className="font-serif text-[22px] tracking-[-0.02em] text-atlas-ink">{fmtH(currentHours)}</p>
        {!seasonComplete && (
          <p className="font-mono text-[9px] text-atlas-faint mt-0.5">{Math.round(avgHoursPerWeek * 10) / 10}h/week avg</p>
        )}
      </div>

      {!seasonComplete && (
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted mb-1">Projected by Apr 30</p>
          <p className="font-serif text-[22px] tracking-[-0.02em] text-atlas-muted">~{fmtH(projectedTotal)}</p>
          <p className="font-serif italic text-[12px] text-atlas-faint mt-0.5">estimate</p>
        </div>
      )}

      {prevSeasonHours != null && (
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted mb-1">
            {seasonComplete ? 'vs last season' : 'Last season'}
          </p>
          <p className="font-serif text-[22px] tracking-[-0.02em] text-atlas-ink">{fmtH(prevSeasonHours)}</p>
          {prevDelta != null && (
            <p className={`font-mono text-[9px] mt-0.5 ${prevDelta >= 0 ? 'text-[#7a9c66]' : 'text-atlas-accent'}`}>
              {prevDelta >= 0 ? '+' : ''}{prevDelta}% {seasonComplete ? '' : 'projected'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
