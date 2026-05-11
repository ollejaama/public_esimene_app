'use client'

import { useState } from 'react'

interface ContributionEditorProps {
  activityId: string
  initialHours: number | null
}

export function ContributionEditor({ activityId, initialHours }: ContributionEditorProps) {
  const [hours, setHours] = useState<number | null>(initialHours)
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(initialHours != null ? String(initialHours) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(contribution_hours: number | null) {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/activity/${activityId}/contribution`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contribution_hours }),
    })
    setSaving(false)
    if (!res.ok) {
      setError('Failed to save')
      return
    }
    setHours(contribution_hours)
    setEditing(false)
  }

  function handleSave() {
    const val = parseFloat(inputValue)
    if (isNaN(val) || val <= 0) {
      setError('Enter a positive number of hours')
      return
    }
    save(Math.round(val * 10) / 10)
  }

  function handleClear() {
    setInputValue('')
    save(null)
  }

  return (
    <div>
      <dt className="text-xs text-gray-400">Contribution</dt>
      {editing ? (
        <dd className="mt-0.5">
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="number"
              min={0.1}
              step={0.5}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="hours"
              className="w-20 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <span className="text-xs text-gray-400">h</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium text-gray-700 hover:text-gray-900 disabled:opacity-40"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null) }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
        </dd>
      ) : (
        <dd className="mt-0.5 flex items-center gap-2">
          {hours != null ? (
            <>
              <span className="text-sm font-medium text-gray-900">{hours}h</span>
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none">PARTIAL</span>
              <button
                onClick={() => { setInputValue(String(hours)); setEditing(true) }}
                className="text-[10px] text-gray-400 hover:text-gray-700"
              >
                edit
              </button>
              <button
                onClick={handleClear}
                className="text-[10px] text-gray-400 hover:text-red-600"
              >
                clear
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              + Set partial contribution
            </button>
          )}
        </dd>
      )}
    </div>
  )
}
