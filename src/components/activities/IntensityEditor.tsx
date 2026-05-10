'use client'

import { useState } from 'react'

type IntensityType = 'regular' | 'interval' | 'speed' | 'competition'

interface IntensityEditorProps {
  activityId: string
  initialValue: IntensityType | null
}

export function IntensityEditor({ activityId, initialValue }: IntensityEditorProps) {
  const [value, setValue] = useState<IntensityType>(initialValue ?? 'regular')
  const [saving, setSaving] = useState(false)

  async function handleClick(newValue: IntensityType) {
    if (newValue === value || saving) return
    setSaving(true)
    await fetch(`/api/activity/${activityId}/intensity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intensity_type: newValue }),
    })
    setValue(newValue)
    setSaving(false)
  }

  return (
    <div className="col-span-2">
      <dt className="text-xs text-gray-400 mb-1.5">Intensity</dt>
      <div className="flex gap-2">
        {(['regular', 'interval', 'speed', 'competition'] as const).map((val) => (
          <button
            key={val}
            onClick={() => handleClick(val)}
            disabled={saving}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-60 ${
              value === val
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
            }`}
          >
            {val.charAt(0).toUpperCase() + val.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
