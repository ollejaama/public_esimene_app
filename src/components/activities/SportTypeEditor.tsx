'use client'

import { useState } from 'react'
import { CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'

const SPORT_TYPE_OPTIONS = [
  { value: 'Running',              label: 'Running' },
  { value: 'Treadmill running',    label: 'Treadmill running' },
  { value: 'crosscountry_classic', label: 'Cross-country classic' },
  { value: 'cr_skate',             label: 'Cross-country skate' },
  { value: 'rollerski_classic',    label: 'Rollerski classic' },
  { value: 'rollerski_skate',      label: 'Rollerski skate' },
  { value: 'treadmill_classic',    label: 'Treadmill classic' },
  { value: 'treadmill_skate',      label: 'Treadmill skate' },
  { value: 'Imitation',            label: 'Imitation' },
  { value: 'Cycling',              label: 'Cycling' },
  { value: 'Strength',             label: 'Strength' },
  { value: 'strength_basic',       label: 'Basic strength' },
  { value: 'Other',                label: 'Other' },
]

interface SportTypeEditorProps {
  activityId: string
  initialOverride: string | null
  originalSportType: string
  customTag: string | null
}

function getSportLabel(key: string): string {
  return CUSTOM_SPORT_TAG_LABELS[key as CustomSportTag] ?? key
}

export function SportTypeEditor({ activityId, initialOverride, originalSportType, customTag }: SportTypeEditorProps) {
  const [override, setOverride] = useState<string | null>(initialOverride)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(initialOverride ?? '')

  const displayed = override
    ? getSportLabel(override)
    : customTag
    ? getSportLabel(customTag)
    : originalSportType

  function openEdit() {
    setSelected(override ?? '')
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/activity/${activityId}/sport-type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_sport_type: selected || null }),
      })
      if (!res.ok) { setError('Save failed'); return }
      setOverride(selected || null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/activity/${activityId}/sport-type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_sport_type: null }),
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
        <dt className="text-xs text-gray-400 mb-1">Sport</dt>
        <dd className="flex items-center gap-2 flex-wrap">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="border border-[#e5e5e5] rounded px-2 py-0.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="">— use original —</option>
            {SPORT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
      <dt className="text-xs text-gray-400">Sport</dt>
      <dd className="flex items-center gap-2 mt-0.5">
        <span className="text-sm text-gray-900 font-medium">{displayed}</span>
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
          title="Edit sport type"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </dd>
    </div>
  )
}
