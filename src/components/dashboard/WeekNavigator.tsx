'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getISOWeek, getWeekStart } from '@/lib/analytics/weekSummary'

interface WeekNavigatorProps {
  week: number
  year: number
}

export function WeekNavigator({ week, year }: WeekNavigatorProps) {
  const router = useRouter()

  function navigate(offset: number) {
    const weekStart = getWeekStart(year, week)
    weekStart.setDate(weekStart.getDate() + offset * 7)
    const { week: newWeek, year: newYear } = getISOWeek(weekStart)
    router.push(`/dashboard?week=${newWeek}&year=${newYear}`)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        aria-label="Previous week"
      >
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
      <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
        Week {week} — {year}
      </span>
      <button
        onClick={() => navigate(1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        aria-label="Next week"
      >
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
