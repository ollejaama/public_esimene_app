'use client'

import { useState } from 'react'
import { LactateMeasurement } from '@/lib/supabase/types'

interface LactateInputProps {
  activityId: string
  initialValues: LactateMeasurement[]
}

export function LactateInput({ activityId, initialValues }: LactateInputProps) {
  const [measurements, setMeasurements] = useState<LactateMeasurement[]>(initialValues)
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd() {
    const num = parseFloat(inputValue.replace(',', '.'))
    if (isNaN(num) || num <= 0 || num > 30) return
    setAdding(true)
    const res = await fetch(`/api/activity/${activityId}/lactate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value_mmol: num }),
    })
    if (res.ok) {
      const created = await res.json()
      setMeasurements((prev) => [...prev, created])
      setInputValue('')
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/activity/${activityId}/lactate?measurementId=${id}`, { method: 'DELETE' })
    setMeasurements((prev) => prev.filter((m) => m.id !== id))
    setDeletingId(null)
  }

  return (
    <div>
      {measurements.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {measurements.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 border border-atlas-rule font-mono text-[11px] text-atlas-ink px-2 py-1"
            >
              {m.value_mmol} mmol/L
              <button
                onClick={() => handleDelete(m.id)}
                disabled={deletingId === m.id}
                className="text-atlas-faint hover:text-atlas-ink disabled:opacity-40 leading-none transition-colors"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="0"
          max="30"
          placeholder="0.0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          className="w-20 border border-atlas-rule bg-transparent font-mono text-[12px] text-atlas-ink px-2 py-1 focus:outline-none focus:border-atlas-muted"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !inputValue}
          className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink disabled:opacity-40 transition-colors"
        >
          {adding ? '…' : '+ Add'}
        </button>
      </div>
    </div>
  )
}
