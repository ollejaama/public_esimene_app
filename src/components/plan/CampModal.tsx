'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TrainingCamp } from '@/lib/supabase/types'

interface CampModalProps {
  mode: 'add' | 'edit'
  camp?: TrainingCamp
  defaultStartDate?: string
  onClose: () => void
  onSaved: () => void
  apiBase?: string // defaults to /api/training-camps
  extraBody?: Record<string, unknown> // extra fields merged into POST body (e.g. teamId)
}

export function CampModal({ mode, camp, defaultStartDate, onClose, onSaved, apiBase = '/api/training-camps', extraBody }: CampModalProps) {
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
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), start_date: startDate, end_date: endDate, notes: notes.trim() || null, ...extraBody }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      } else {
        const res = await fetch(`${apiBase}/${camp!.id}`, {
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
      const res = await fetch(`${apiBase}/${camp!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm" hideCloseButton>
      {/* Header band */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-atlas-rule">
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted">Plan · camp</p>
          <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink mt-0.5">
            ⛺ {mode === 'add' ? 'Add camp' : 'Edit camp'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="mt-1 w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Name */}
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Name</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spring camp"
            className="w-full border border-atlas-rule bg-transparent text-atlas-ink font-serif text-[13px] px-3 py-2 focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Start</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-atlas-rule bg-transparent text-atlas-ink font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-atlas-muted"
            />
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">End</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-atlas-rule bg-transparent text-atlas-ink font-mono text-[12px] px-3 py-2 focus:outline-none focus:border-atlas-muted"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Location, goals, etc."
            className="w-full border border-atlas-rule bg-transparent text-atlas-ink font-serif text-[13px] px-3 py-2 resize-none focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint"
          />
        </div>

        {error && <p className="font-mono text-[10px] text-[#a23b2a]">{error}</p>}

        {/* Actions */}
        <div className="flex items-center pt-2 border-t border-atlas-rule">
          {mode === 'edit' && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`font-mono text-[10px] tracking-[0.1em] uppercase transition-opacity disabled:opacity-40 ${confirmDelete ? 'text-[#a23b2a] font-bold' : 'text-[#a23b2a] hover:opacity-70'}`}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="font-mono text-[10px] tracking-[0.1em] uppercase bg-atlas-ink text-atlas-bg px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
