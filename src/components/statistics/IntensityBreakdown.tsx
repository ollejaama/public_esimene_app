'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity } from '@/lib/supabase/types'
import { getActivityTitle, effectiveDuration, effectiveSportKey } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { Modal } from '@/components/ui/Modal'

interface IntensityBreakdownProps {
  activities: Activity[]
  intervalZoneSummary?: { zone: string; bookedSecs: number; actualSecs: number }[]
}

type CategoryType = 'regular' | 'interval' | 'speed' | 'competition' | 'strength'

const CATEGORY_LABELS: Record<CategoryType, string> = {
  regular: 'Regular',
  interval: 'Interval',
  speed: 'Speed',
  competition: 'Competition',
  strength: 'Strength',
}

const CATEGORY_BADGE: Record<CategoryType, string> = {
  regular: 'text-atlas-muted',
  interval: 'text-atlas-accent atlas-pill-interval border border-atlas-accent',
  speed: 'atlas-badge-speed border',
  competition: 'atlas-badge-competition border',
  strength: 'text-atlas-muted',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function IntensityBreakdown({ activities, intervalZoneSummary = [] }: IntensityBreakdownProps) {
  const [selected, setSelected] = useState<CategoryType | null>(null)

  const nonStrength = activities.filter((a) => {
    const key = effectiveSportKey(a)
    return key !== 'Strength' && key !== 'strength_basic'
  })

  const strengthActivities = activities.filter((a) => effectiveSportKey(a) === 'Strength')

  const counts: Record<CategoryType, number> = {
    regular: nonStrength.filter((a) => !a.intensity_type || a.intensity_type === 'regular').length,
    interval: nonStrength.filter((a) => a.intensity_type === 'interval').length,
    speed: nonStrength.filter((a) => a.intensity_type === 'speed').length,
    competition: nonStrength.filter((a) => a.intensity_type === 'competition').length,
    strength: strengthActivities.length,
  }

  const filtered = selected
    ? (selected === 'strength'
        ? strengthActivities
        : nonStrength.filter((a) =>
            selected === 'regular'
              ? !a.intensity_type || a.intensity_type === 'regular'
              : a.intensity_type === selected
          )
      ).sort((a, b) => b.start_date.localeCompare(a.start_date))
    : []

  return (
    <>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {(['regular', 'interval', 'speed', 'competition', 'strength'] as CategoryType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className="flex flex-col items-center py-4 px-2 border border-atlas-rule bg-atlas-bg hover:border-atlas-muted transition-colors"
          >
            <span className="font-serif text-[36px] tracking-[-0.02em] leading-none text-atlas-ink">
              {counts[type]}
            </span>
            <span className={`font-mono text-[9px] px-2 py-[3px] tracking-[0.12em] uppercase font-semibold mt-2 ${CATEGORY_BADGE[type]}`}>
              {CATEGORY_LABELS[type]}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <Modal open onClose={() => setSelected(null)} maxWidth="max-w-[480px]" align="center" hideCloseButton>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-atlas-rule bg-atlas-bg relative" style={{ padding: '16px 20px 14px' }}>
            <div>
              <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink">{CATEGORY_LABELS[selected]} sessions</h2>
              <p className="font-serif italic text-[13px] text-atlas-muted mt-0.5">{counts[selected]} activities</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '12px 20px 20px' }}>
            {filtered.length === 0 ? (
              <p className="font-serif italic text-[13px] text-atlas-faint">
                No {CATEGORY_LABELS[selected].toLowerCase()} sessions in this period.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {filtered.map((a) => (
                  <Link
                    key={a.id}
                    href={`/activities/${a.id}?from=statistics&expanded=true`}
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-3 py-2 border-b border-dotted border-atlas-rule hover:bg-atlas-bg transition-colors"
                  >
                    <span className="font-serif text-[14px] text-atlas-ink truncate flex-1">{getActivityTitle(a)}</span>
                    <span className="font-serif italic text-[12px] text-atlas-muted flex-shrink-0">{formatDate(a.start_date)}</span>
                    <span className="font-mono text-[11px] text-atlas-muted flex-shrink-0">{formatDuration(effectiveDuration(a))}</span>
                  </Link>
                ))}
              </div>
            )}

            {selected === 'interval' && intervalZoneSummary.length > 0 && (
              <div className="mt-4 pt-3 border-t border-atlas-rule">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted mb-2">Zone breakdown</p>
                <div>
                  {intervalZoneSummary.map(({ zone, bookedSecs, actualSecs }) => (
                    <div key={zone} className="flex items-center gap-3 py-1.5 border-b border-dotted border-atlas-rule">
                      <span className="font-mono text-[11px] font-semibold text-atlas-ink w-6">{zone}</span>
                      <span className="font-serif italic text-[12px] text-atlas-muted flex-1">Booked</span>
                      <span className="font-mono text-[11px] text-atlas-muted">{formatDuration(bookedSecs)}</span>
                      <span className="font-serif italic text-[12px] text-atlas-muted">Actual</span>
                      <span className="font-mono text-[11px] text-atlas-ink">{formatDuration(actualSecs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
