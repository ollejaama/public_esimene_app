'use client'

import { useRouter } from 'next/navigation'

export type TimeRange = 'week' | 'month' | 'season'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'season', label: 'Season' },
]

interface TimeRangeSelectorProps {
  current: TimeRange
  offset: number
  periodLabel: string
  basePath?: string
}

export function TimeRangeSelector({ current, offset, periodLabel, basePath = '/statistics' }: TimeRangeSelectorProps) {
  const router = useRouter()

  function setRange(range: TimeRange) {
    router.push(`${basePath}?range=${range}&offset=0`)
  }

  function navigate(dir: number) {
    router.push(`${basePath}?range=${current}&offset=${offset + dir}`)
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        {RANGES.map((r) => {
          const on = r.value === current
          return (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`font-mono text-[10px] tracking-[0.12em] uppercase px-3 py-[5px] border transition-colors ${
                on
                  ? 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected'
                  : 'bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted'
              }`}
            >
              {r.label}
            </button>
          )
        })}
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted transition-colors"
          aria-label="Previous"
        >
          ←
        </button>
        <button
          onClick={() => navigate(1)}
          disabled={offset >= 0}
          className="font-mono text-[11px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted disabled:opacity-30 transition-colors"
          aria-label="Next"
        >
          →
        </button>
      </div>
      <p className="font-serif italic text-[13px] text-atlas-muted">
        viewing — {periodLabel}
      </p>
    </div>
  )
}
