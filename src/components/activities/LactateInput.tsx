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
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1.5 px-1">
        Lactate (mmol/L)
      </p>

      {/* Existing measurements */}
      {measurements.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1">
          {measurements.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
            >
              {m.value_mmol} mmol
              <button
                onClick={() => handleDelete(m.id)}
                disabled={deletingId === m.id}
                className="text-blue-400 hover:text-blue-700 disabled:opacity-40 leading-none"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add input */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="number"
          step="0.1"
          min="0"
          max="30"
          placeholder="0.0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !inputValue}
          className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40 transition-colors"
        >
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </div>
    </div>
  )
}
