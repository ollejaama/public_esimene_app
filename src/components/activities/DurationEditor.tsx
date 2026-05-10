'use client'

import { useState } from 'react'
import { formatDuration } from '@/lib/analytics/hrZones'

interface DurationEditorProps {
  activityId: string
  initialOverride: number | null  // overridden_duration in seconds
  originalDuration: number        // moving_time ?? elapsed_time in seconds
}

export function DurationEditor({ activityId, initialOverride, originalDuration }: DurationEditorProps) {
  const [override, setOverride] = useState<number | null>(initialOverride)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayed = override ?? originalDuration
  const editHours = Math.floor(displayed / 3600)
  const editMins = Math.floor((displayed % 3600) / 60)

  const [hours, setHours] = useState(editHours)
  const [mins, setMins] = useState(editMins)

  function openEdit() {
    // Pre-fill inputs from current effective duration
    const eff = override ?? originalDuration
    setHours(Math.floor(eff / 3600))
    setMins(Math.floor((eff % 3600) / 60))
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    const seconds = hours * 3600 + mins * 60
    if (seconds <= 0) { setError('Must be > 0'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/activity/${activityId}/duration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_duration: seconds }),
      })
      if (!res.ok) { setError('Save failed'); return }
      setOverride(seconds)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/activity/${activityId}/duration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_duration: null }),
      })
      if (!res.ok) { setError('Reset failed'); return }
      setOverride(null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div>
        <dt className="text-xs text-gray-400 mb-1">Duration</dt>
        <dd className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={23} value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 border border-[#e5e5e5] rounded px-1.5 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-400">h</span>
            <input
              type="number" min={0} max={59} value={mins}
              onChange={(e) => setMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-12 border border-[#e5e5e5] rounded px-1.5 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-400">min</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave} disabled={saving}
              className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <span className="text-xs text-red-500 w-full">{error}</span>}
        </dd>
      </div>
    )
  }

  return (
    <div>
      <dt className="text-xs text-gray-400">Duration</dt>
      <dd className="flex items-center gap-2 mt-0.5">
        <span className="text-sm text-gray-900 font-medium">{formatDuration(displayed)}</span>
        {override !== null && (
          <>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">edited</span>
            <button
              onClick={handleReset} disabled={saving}
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            >
              {saving ? '…' : 'Reset'}
            </button>
          </>
        )}
        <button
          onClick={openEdit}
          className="text-gray-300 hover:text-gray-600 transition-colors ml-auto"
          title="Edit duration"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </dd>
    </div>
  )
}
