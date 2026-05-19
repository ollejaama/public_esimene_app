'use client'

import { useState } from 'react'
import { TrainingCamp } from '@/lib/supabase/types'

interface CampModalProps {
  mode: 'add' | 'edit'
  camp?: TrainingCamp
  defaultStartDate?: string
  onClose: () => void
  onSaved: () => void
}

export function CampModal({ mode, camp, defaultStartDate, onClose, onSaved }: CampModalProps) {
  const [name, setName] = useState(camp?.name ?? '')
  const [startDate, setStartDate] = useState(camp?.start_date ?? defaultStartDate ?? '')
  const [endDate, setEndDate] = useState(camp?.end_date ?? '')
  const [notes, setNotes] = useState(camp?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim() || !startDate || !endDate) {
      setError('Name, start date, and end date are required.')
      return
    }
    if (startDate > endDate) {
      setError('Start date must be before end date.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (mode === 'add') {
        const res = await fetch('/api/training-camps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), start_date: startDate, end_date: endDate, notes: notes.trim() || null }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      } else {
        const res = await fetch(`/api/training-camps/${camp!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), start_date: startDate, end_date: endDate, notes: notes.trim() || null }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      }
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/training-camps/${camp!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {mode === 'add' ? 'Add training camp' : 'Edit training camp'}
        </h2>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Camp name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring camp"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Location, goals, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex items-center gap-2">
          {mode === 'edit' && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                confirmDelete
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'text-red-500 border-red-200 hover:bg-red-50'
              }`}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={loading}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
