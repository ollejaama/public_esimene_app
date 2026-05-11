'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { PLANNED_SPORT_TYPES } from '@/lib/constants'

const SKIING_TYPES = new Set([
  'Cross-country ski classic',
  'Cross-country ski skate',
  'Rollerski classic',
  'Rollerski skate',
  'Treadmill skiing',
])

const SKIING_TAG_OPTIONS = [
  { label: 'Classic', value: 'crosscountry_classic' },
  { label: 'Skate', value: 'cr_skate' },
  { label: 'Rollerski classic', value: 'rollerski_classic' },
  { label: 'Rollerski skate', value: 'rollerski_skate' },
  { label: 'Treadmill skiing', value: 'treadmill_skiing' },
]

const STRENGTH_TYPES = new Set(['Strength', 'Basic strength'])

function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface ManualActivityModalProps {
  onClose: () => void
}

export function ManualActivityModal({ onClose }: ManualActivityModalProps) {
  const router = useRouter()
  const [sportType, setSportType] = useState<string>(PLANNED_SPORT_TYPES[0])
  const [customTag, setCustomTag] = useState<string>('')
  const [date, setDate] = useState(todayString())
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning')
  const [hours, setHours] = useState(1)
  const [minutes, setMinutes] = useState(0)
  const [intensityType, setIntensityType] = useState<'regular' | 'interval' | 'speed' | 'competition' | 'basic'>('regular')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSkiing = SKIING_TYPES.has(sportType)
  const isStrength = STRENGTH_TYPES.has(sportType)

  async function handleSave() {
    setError(null)
    const duration_seconds = hours * 3600 + minutes * 60
    if (duration_seconds <= 0) {
      setError('Duration must be greater than 0')
      return
    }

    const resolvedIntensity = isStrength
      ? (intensityType === 'basic' ? 'regular' : 'regular')
      : intensityType === 'basic' ? 'regular' : intensityType

    const resolvedTag = isStrength && intensityType === 'basic'
      ? 'strength_basic'
      : isSkiing && customTag
        ? customTag
        : null

    setSaving(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_type: sportType,
          custom_sport_tag: resolvedTag,
          date,
          time_of_day: timeOfDay,
          duration_seconds,
          intensity_type: resolvedIntensity,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md">
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Add manual training</h2>
          <p className="text-xs text-gray-400 mt-0.5">Not synced from Strava</p>
        </div>

        {/* Sport type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">Sport type</label>
          <select
            value={sportType}
            onChange={(e) => { setSportType(e.target.value); setCustomTag('') }}
            className="w-full border border-[#e5e5e5] rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            {PLANNED_SPORT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Custom tag for skiing */}
        {isSkiing && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Skiing style</label>
            <div className="flex flex-wrap gap-1.5">
              {SKIING_TAG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCustomTag(customTag === opt.value ? '' : opt.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    customTag === opt.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-[#e5e5e5] rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Time of day */}
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

        {/* Intensity */}
        {isStrength ? (
          <div className="flex gap-2">
            {(['regular', 'basic'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setIntensityType(val)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  intensityType === val
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
                }`}
              >
                {val === 'regular' ? 'Regular' : 'Basic'}
              </button>
            ))}
          </div>
        ) : (
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
                    : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
                }`}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes..."
            className="w-full border border-[#e5e5e5] rounded-md px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {saving ? 'Adding…' : 'Add training'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
