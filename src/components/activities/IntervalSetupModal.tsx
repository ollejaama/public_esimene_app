'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { formatDuration } from '@/lib/analytics/hrZones'

const ZONE_OPTIONS = ['I2', 'I3', 'I4', 'I5', 'Progressive'] as const
type Zone = typeof ZONE_OPTIONS[number]

interface EditableSet {
  reps: number
  duration_secs: number
  zone: Zone
}

interface IntervalSetupModalProps {
  activityId: string
  onClose: () => void
  onSaved?: () => void
}

export function IntervalSetupModal({ activityId, onClose, onSaved }: IntervalSetupModalProps) {
  const [sets, setSets] = useState<EditableSet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/activity/${activityId}/interval-sets`)
      .then((r) => r.json())
      .then((data: Array<{ reps: number; duration_secs: number; zone: string }>) => {
        if (data.length > 0) {
          setSets(data.map((s) => ({ reps: s.reps, duration_secs: s.duration_secs, zone: s.zone as Zone })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activityId])

  function addSet() {
    setSets((prev) => [...prev, { reps: 5, duration_secs: 180, zone: 'I3' }])
  }

  function removeSet(i: number) {
    setSets((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateSet(i: number, patch: Partial<EditableSet>) {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/activity/${activityId}/interval-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sets }),
    })
    setSaving(false)
    onSaved?.()
    onClose()
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Interval sets</h2>
          <p className="text-xs text-gray-400 mt-0.5">Log the planned set structure</p>
        </div>

        {loading ? (
          <p className="text-xs text-gray-400 py-4 text-center">Loading…</p>
        ) : (
          <div className="space-y-2">
            {sets.length === 0 && (
              <p className="text-xs text-gray-400 py-2">No sets yet — add one below.</p>
            )}
            {sets.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <select
                  value={s.zone}
                  onChange={(e) => updateSet(i, { zone: e.target.value as Zone })}
                  className="border border-[#e5e5e5] rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  {ZONE_OPTIONS.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
                <input
                  type="number"
                  min={1}
                  value={s.reps}
                  onChange={(e) => updateSet(i, { reps: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-14 border border-[#e5e5e5] rounded px-2 py-1 text-xs text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <span className="text-xs text-gray-400">×</span>
                <input
                  type="number"
                  min={1}
                  value={Math.round(s.duration_secs / 60)}
                  onChange={(e) => updateSet(i, { duration_secs: Math.max(1, parseInt(e.target.value) || 1) * 60 })}
                  className="w-16 border border-[#e5e5e5] rounded px-2 py-1 text-xs text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <span className="text-xs text-gray-400">min</span>
                <span className="text-xs text-gray-400 ml-1">= {formatDuration(s.reps * s.duration_secs)}</span>
                <button
                  onClick={() => removeSet(i)}
                  className="ml-auto text-xs text-gray-300 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              onClick={addSet}
              className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              + Add set
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-[#f0f0f0]">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save sets'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
