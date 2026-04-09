'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'

export type TimeRange = 'week' | 'month' | 'year' | 'all'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All time' },
]

interface TimeRangeSelectorProps {
  current: TimeRange
  offset: number
  periodLabel: string
}

export function TimeRangeSelector({ current, offset, periodLabel }: TimeRangeSelectorProps) {
  const router = useRouter()

  function setRange(range: TimeRange) {
    router.push(`/statistics?range=${range}&offset=0`)
  }

  function navigate(dir: number) {
    router.push(`/statistics?range=${current}&offset=${offset + dir}`)
  }

  if (current === 'all') {
    return (
      <div className="flex items-center gap-4 mb-6">
        <RangeTabs current={current} onSelect={setRange} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6 mb-6">
      <RangeTabs current={current} onSelect={setRange} />
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 rounded"
          aria-label="Previous"
        >
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">{periodLabel}</span>
        <button
          onClick={() => navigate(1)}
          disabled={offset >= 0}
          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
          aria-label="Next"
        >
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function RangeTabs({ current, onSelect }: { current: TimeRange; onSelect: (r: TimeRange) => void }) {
  return (
    <div className="flex border border-[#e5e5e5] rounded-lg overflow-hidden">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onSelect(r.value)}
          className={clsx(
            'px-4 py-1.5 text-sm transition-colors',
            current === r.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
