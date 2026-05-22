'use client'

import { useRouter } from 'next/navigation'
import { getISOWeek, getWeekStart } from '@/lib/analytics/weekSummary'

interface WeekNavigatorProps {
  week: number
  year: number
  basePath?: string
  extraParams?: string // e.g. "planView=team" — appended to the query string
}

export function WeekNavigator({ week, year, basePath = '/dashboard', extraParams }: WeekNavigatorProps) {
  const router = useRouter()

  function navigate(offset: number) {
    const weekStart = getWeekStart(year, week)
    weekStart.setDate(weekStart.getDate() + offset * 7)
    const { week: newWeek, year: newYear } = getISOWeek(weekStart)
    const extra = extraParams ? `${extraParams}&` : ''
    router.push(`${basePath}?${extra}week=${newWeek}&year=${newYear}`)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => navigate(-1)}
        className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors"
        aria-label="Previous week"
      >
        ←
      </button>
      <span className="font-serif italic text-[13px] text-atlas-muted min-w-[80px] text-center">
        W{week} · {year}
      </span>
      <button
        onClick={() => navigate(1)}
        className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors"
        aria-label="Next week"
      >
        →
      </button>
    </div>
  )
}
