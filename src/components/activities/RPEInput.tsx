'use client'

import { useState } from 'react'

interface RPEInputProps {
  activityId: string
  initialValue: number | null
  scale: 'rpe' | 'borg'
}

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// Common Borg CR10 anchor points displayed as buttons
const BORG_VALUES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

export function RPEInput({ activityId, initialValue, scale }: RPEInputProps) {
  const [value, setValue] = useState<number | null>(initialValue)
  const [saving, setSaving] = useState(false)

  const buttons = scale === 'rpe' ? RPE_VALUES : BORG_VALUES

  async function handleSelect(v: number) {
    const next = value === v ? null : v  // tap same value to clear
    setValue(next)
    setSaving(true)
    await fetch(`/api/activity/${activityId}/rpe`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rpe: next }),
    })
    setSaving(false)
  }

  const label = scale === 'rpe' ? 'RPE (1–10)' : 'Borg (6–20)'

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1.5 px-1">
        {label}{saving && <span className="ml-1 text-gray-300">…</span>}
      </p>
      <div className="flex flex-wrap gap-1 px-1">
        {buttons.map((v) => (
          <button
            key={v}
            onClick={() => handleSelect(v)}
            className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
              value === v
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
