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

const CATEGORY_COLORS: Record<CategoryType, string> = {
  regular: 'text-gray-500 bg-gray-100',
  interval: 'text-red-600 bg-red-50',
  speed: 'text-blue-600 bg-blue-50',
  competition: 'text-green-600 bg-green-50',
  strength: 'text-orange-600 bg-orange-50',
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
      <div className="flex gap-3">
        {(['regular', 'interval', 'speed', 'competition', 'strength'] as CategoryType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className="flex-1 flex flex-col items-center py-3 px-2 rounded-lg border transition-colors border-[#e5e5e5] bg-white hover:border-gray-300"
          >
            <span className="text-xl font-semibold text-gray-700">{counts[type]}</span>
            <span className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[type]}`}>
              {CATEGORY_LABELS[type]}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <Modal open onClose={() => setSelected(null)} maxWidth="max-w-md" align="center">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 pr-8">
              {CATEGORY_LABELS[selected]} sessions
            </h2>
            <p className="text-xs text-gray-400 mb-5">{counts[selected]} activities</p>

            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400">No {CATEGORY_LABELS[selected].toLowerCase()} sessions in this period.</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {filtered.map((a) => (
                  <Link
                    key={a.id}
                    href={`/activities/${a.id}?from=statistics&expanded=true`}
                    onClick={() => setSelected(null)}
                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3">{getActivityTitle(a)}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 mr-3">{formatDate(a.start_date)}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{formatDuration(effectiveDuration(a))}</span>
                  </Link>
                ))}
              </div>
            )}

            {selected === 'interval' && intervalZoneSummary.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#f0f0f0]">
                <p className="text-xs font-medium text-gray-500 mb-2">Zone breakdown</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left pb-1 font-normal">Zone</th>
                      <th className="text-right pb-1 font-normal">Booked</th>
                      <th className="text-right pb-1 font-normal">Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9f9f9]">
                    {intervalZoneSummary.map(({ zone, bookedSecs, actualSecs }) => (
                      <tr key={zone}>
                        <td className="py-1 text-gray-700 font-medium">{zone}</td>
                        <td className="py-1 text-right font-mono tabular-nums text-gray-600">{formatDuration(bookedSecs)}</td>
                        <td className="py-1 text-right font-mono tabular-nums text-gray-600">{formatDuration(actualSecs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
