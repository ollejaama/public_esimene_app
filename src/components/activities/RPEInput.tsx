'use client'

import { useState } from 'react'

interface RPEInputProps {
  activityId: string
  initialValue: number | null
  scale: 'rpe' | 'borg'
}

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const BORG_VALUES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

export function RPEInput({ activityId, initialValue, scale }: RPEInputProps) {
  const [value, setValue] = useState<number | null>(initialValue)
  const [saving, setSaving] = useState(false)

  const buttons = scale === 'rpe' ? RPE_VALUES : BORG_VALUES

  async function handleSelect(v: number) {
    const next = value === v ? null : v
    setValue(next)
    setSaving(true)
    await fetch(`/api/activity/${activityId}/rpe`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rpe: next }),
    })
    setSaving(false)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {buttons.map((v) => (
          <button
            key={v}
            onClick={() => handleSelect(v)}
            className={[
              'w-7 h-7 font-mono text-[11px] tabular-nums border transition-colors',
              value === v
                ? 'bg-atlas-ink text-atlas-bg border-atlas-ink'
                : 'bg-transparent text-atlas-muted border-atlas-rule hover:border-atlas-muted hover:text-atlas-ink',
            ].join(' ')}
          >
            {v}
          </button>
        ))}
        {saving && <span className="font-mono text-[9px] text-atlas-faint self-center ml-1">…</span>}
      </div>
    </div>
  )
}
