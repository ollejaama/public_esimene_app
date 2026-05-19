'use client'

import { useEffect, useState } from 'react'
import { ZoneRow, formatDuration } from '@/lib/analytics/hrZones'
import { IntervalSetupModal } from './IntervalSetupModal'

interface IntervalSet {
  reps: number
  duration_secs: number
  zone: string
}

function computeBookedZones(sets: IntervalSet[]): Record<string, number> {
  const booked: Record<string, number> = { I2: 0, I3: 0, I4: 0, I5: 0 }
  for (const s of sets) {
    const total = s.reps * s.duration_secs
    if (s.zone === 'Progressive') {
      booked.I2 += total / 4; booked.I3 += total / 4
      booked.I4 += total / 4; booked.I5 += total / 4
    } else {
      booked[s.zone] = (booked[s.zone] ?? 0) + total
    }
  }
  return booked
}

interface IntervalSetsSectionProps {
  activityId: string
  zoneRows: ZoneRow[]
  hasHRData: boolean
}

export function IntervalSetsSection({ activityId, zoneRows, hasHRData }: IntervalSetsSectionProps) {
  const [sets, setSets] = useState<IntervalSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  function fetchSets() {
    fetch(`/api/activity/${activityId}/interval-sets`)
      .then((r) => r.json())
      .then((data) => { setSets(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSets() }, [activityId])

  const bookedZones = computeBookedZones(sets)

  const actualZones: Record<string, number> = { I2: 0, I3: 0, I4: 0, I5: 0 }
  for (const row of zoneRows) {
    if (row.name === 'I2' || row.name === 'I3' || row.name === 'I4' || row.name === 'I5') {
      actualZones[row.name] = row.seconds
    }
  }

  const comparisonZones = (['I2', 'I3', 'I4', 'I5'] as const).filter(
    (z) => bookedZones[z] > 0 || actualZones[z] > 0
  )

  return (
    <>
      <div className="border border-[#e5e5e5] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Interval Sets</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors underline underline-offset-2"
          >
            {sets.length === 0 ? 'Add sets' : 'Edit sets'}
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : sets.length === 0 ? (
          <p className="text-xs text-gray-400">No sets recorded.</p>
        ) : (
          <>
            {/* Set list */}
            <div className="space-y-1">
              {sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium w-12">{s.zone}</span>
                  <span>{s.reps} × {Math.round(s.duration_secs / 60)} min</span>
                  <span className="text-gray-400">= {formatDuration(s.reps * s.duration_secs)}</span>
                </div>
              ))}
            </div>

            {/* Zone comparison */}
            {hasHRData && comparisonZones.length > 0 && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Zone comparison</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left pb-1 font-normal">Zone</th>
                      <th className="text-right pb-1 font-normal">Booked</th>
                      <th className="text-right pb-1 font-normal">Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9f9f9]">
                    {comparisonZones.map((z) => (
                      <tr key={z}>
                        <td className="py-1 text-gray-700 font-medium">{z}</td>
                        <td className="py-1 text-right font-mono tabular-nums text-gray-600">{formatDuration(bookedZones[z])}</td>
                        <td className="py-1 text-right font-mono tabular-nums text-gray-600">{formatDuration(actualZones[z])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <IntervalSetupModal
          activityId={activityId}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchSets() }}
        />
      )}
    </>
  )
}
