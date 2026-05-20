'use client'

import { useState } from 'react'

type IntensityType = 'regular' | 'interval' | 'speed' | 'competition'

interface IntensityEditorProps {
  activityId: string
  initialValue: IntensityType | null
  onChanged?: (val: IntensityType) => void
}

const LABELS: Record<IntensityType, string> = {
  regular: 'Easy',
  speed: 'Speed',
  interval: 'Interval',
  competition: 'Competition',
}

export function IntensityEditor({ activityId, initialValue, onChanged }: IntensityEditorProps) {
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
    if (onChanged) onChanged(newValue)
    setSaving(false)
  }

  return (
    <div className="flex gap-1.5">
      {(['regular', 'interval', 'speed', 'competition'] as const).map((val) => {
        const on = value === val
        const isInterval = val === 'interval'
        return (
          <button
            key={val}
            onClick={() => handleClick(val)}
            disabled={saving}
            className={`flex-1 py-[7px] px-2 font-serif text-[13px] border transition-colors disabled:opacity-60 ${
              on
                ? isInterval
                  ? 'bg-atlas-accent text-atlas-selectedFg border-atlas-accent italic'
                  : 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected italic'
                : 'bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted'
            }`}
          >
            {LABELS[val]}
          </button>
        )
      })}
    </div>
  )
}
