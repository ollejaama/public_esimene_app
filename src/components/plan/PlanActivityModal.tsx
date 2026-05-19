'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { PlannedActivity } from '@/lib/supabase/types'
import { PLANNED_SPORT_TYPES } from '@/lib/constants'

interface PlanActivityModalProps {
  mode: 'add' | 'edit'
  date: string
  activity?: PlannedActivity
  initialTimeOfDay?: 'morning' | 'evening'
  onClose: () => void
  onSaved: () => void
  initialIsRestDay?: boolean
  onToggleRestDay?: (isRest: boolean) => Promise<void>
}

export function PlanActivityModal({ mode, date, activity, initialTimeOfDay = 'morning', onClose, onSaved, initialIsRestDay, onToggleRestDay }: PlanActivityModalProps) {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>(activity?.time_of_day ?? initialTimeOfDay)
  const [intensityType, setIntensityType] = useState<'regular' | 'interval' | 'speed' | 'competition'>(activity?.intensity_type ?? 'regular')
  const [sportType, setSportType] = useState(activity?.sport_type ?? PLANNED_SPORT_TYPES[0])
  const [hours, setHours] = useState(
    activity ? Math.floor(activity.duration_minutes / 60) : 1
  )
  const [minutes, setMinutes] = useState(
    activity ? activity.duration_minutes % 60 : 0
  )
  const [description, setDescription] = useState(activity?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRestDay, setIsRestDay] = useState(initialIsRestDay ?? false)

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  async function handleSave() {
    setError(null)
    setSaving(true)
    if (onToggleRestDay && (isRestDay || (initialIsRestDay && !isRestDay))) {
      try { await onToggleRestDay(isRestDay) } catch { setError('Failed to save.') }
      setSaving(false)
      return
    }
    const duration_minutes = hours * 60 + minutes
    if (duration_minutes <= 0) {
      setError('Duration must be greater than 0.')
      setSaving(false)
      return
    }

    const body = { date, sport_type: sportType, duration_minutes, description: description || null, time_of_day: timeOfDay, intensity_type: intensityType }

    try {
      const res = mode === 'add'
        ? await fetch('/api/planned-activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/planned-activities/${activity!.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
        return
      }
      onSaved()
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!activity) return
    setError(null)
    setDeleting(true)
    try {
      const res = await fetch(`/api/planned-activities/${activity.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
        return
      }
      onSaved()
    } catch {
      setError('Network error.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {mode === 'add' ? 'Add planned training' : 'Edit planned training'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{displayDate}</p>
          </div>
          {onToggleRestDay && mode === 'add' && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs transition-colors ${isRestDay ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                🌙 Rest day
              </span>
              <button
                type="button"
                onClick={() => setIsRestDay((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                  isRestDay ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                  isRestDay ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          )}
        </div>

        {!isRestDay && (
          <>
            {/* Morning / Evening toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTimeOfDay('morning')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  timeOfDay === 'morning'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
                }`}
              >
                ☀ Morning
              </button>
              <button
                type="button"
                onClick={() => setTimeOfDay('evening')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  timeOfDay === 'evening'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
                }`}
              >
                ☽ Evening
              </button>
            </div>

            {/* Intensity type */}
            <div className="flex gap-2">
              {(['regular', 'interval', 'speed', 'competition'] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setIntensityType(val)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    intensityType === val
                      ? val === 'competition'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-gray-900 text-white border-gray-900'
                      : val === 'competition'
                        ? 'bg-white text-amber-600 border-amber-200 hover:border-amber-400'
                        : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
                  }`}
                >
                  {val === 'competition' ? '★ Comp' : val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>

            {/* Sport type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Sport type</label>
              <select
                value={sportType}
                onChange={(e) => setSportType(e.target.value)}
                className="w-full border border-[#e5e5e5] rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                {PLANNED_SPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Duration</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 border border-[#e5e5e5] rounded-md px-2 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <span className="text-xs text-gray-500">h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 border border-[#e5e5e5] rounded-md px-2 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional notes..."
                className="w-full border border-[#e5e5e5] rounded-md px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300"
              />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {mode === 'edit' ? (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
