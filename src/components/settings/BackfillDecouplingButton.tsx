'use client'

import { useState } from 'react'

export function BackfillDecouplingButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ processed: number; updated: number } | null>(null)
  const [totalUpdated, setTotalUpdated] = useState(0)

  async function handleRun() {
    setStatus('running')
    setTotalUpdated(0)
    let cumUpdated = 0

    // Run in a loop until no more candidates (batch size 50 at a time)
    while (true) {
      const res = await fetch('/api/backfill/decoupling', { method: 'POST' })
      if (!res.ok) { setStatus('error'); return }
      const data: { processed: number; updated: number } = await res.json()
      cumUpdated += data.updated
      setTotalUpdated(cumUpdated)
      if (data.processed === 0) break
    }

    setResult({ processed: -1, updated: cumUpdated })
    setStatus('done')
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Computes aerobic decoupling for all past activities that have HR and GPS data. Runs in batches — may take a moment for large histories.
      </p>
      {status === 'idle' && (
        <button
          onClick={handleRun}
          className="text-sm font-medium text-gray-700 border border-[#e5e5e5] hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          Compute decoupling for all past activities
        </button>
      )}
      {status === 'running' && (
        <p className="text-sm text-gray-500">
          Running… {totalUpdated > 0 && `${totalUpdated} updated so far`}
        </p>
      )}
      {status === 'done' && (
        <p className="text-sm text-green-700">
          Done — {result?.updated ?? totalUpdated} sessions updated.
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}
