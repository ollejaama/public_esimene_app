'use client'

import { useState } from 'react'

interface FeelingInputProps {
  activityId: string
  initialValue: number | null
}

const FEELING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function FeelingInput({ activityId, initialValue }: FeelingInputProps) {
  const [value, setValue] = useState<number | null>(initialValue)
  const [saving, setSaving] = useState(false)

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
      <p className="font-mono text-[10px] uppercase tracking-widest text-atlas-muted mb-1.5">Feeling</p>
      <div className="flex flex-wrap gap-1">
        {FEELING_VALUES.map((v) => (
          <button
            key={v}
            onClick={() => handleSelect(v)}
            className={[
              'w-7 h-7 font-mono text-[11px] tabular-nums border transition-colors',
              value === v
                ? 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected'
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
