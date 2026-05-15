'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { IllnessLog } from '@/lib/supabase/types'

interface IllnessLogModalProps {
  defaultDate: string  // 'YYYY-MM-DD'
  existing?: IllnessLog
  onClose: () => void
}

const CATEGORIES: { value: IllnessLog['category']; label: string; color: string }[] = [
  { value: 'sick',     label: 'Sick',     color: '#ef4444' },
  { value: 'injured',  label: 'Injured',  color: '#fb923c' },
  { value: 'fatigue',  label: 'Fatigue',  color: '#facc15' },
]

export function IllnessLogModal({ defaultDate, existing, onClose }: IllnessLogModalProps) {
  const router = useRouter()
  const [category, setCategory] = useState<IllnessLog['category']>(existing?.category ?? 'sick')
  const [startDate, setStartDate] = useState(existing?.start_date ?? defaultDate)
  const [endDate, setEndDate] = useState(existing?.end_date ?? defaultDate)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    const url = existing ? `/api/illness-log/${existing.id}` : '/api/illness-log'
    const method = existing ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, start_date: startDate, end_date: endDate, notes: notes || null }),
    })
    setSaving(false)
    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!existing) return
    setDeleting(true)
    await fetch(`/api/illness-log/${existing.id}`, { method: 'DELETE' })
    setDeleting(false)
    router.refresh()
    onClose()
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm" align="center">
      <div className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 pr-6">
          {existing ? 'Edit entry' : 'Log illness / injury'}
        </h2>

        {/* Category */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-2">Category</p>
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  category === c.value
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
                style={category === c.value ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Start</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">End</p>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any details…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {existing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Log entry'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
