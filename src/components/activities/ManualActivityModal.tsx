'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'

const MANUAL_SPORT_OPTIONS = [
  { label: 'Running',               sportType: 'Running',               tag: null },
  { label: 'Treadmill running',     sportType: 'Treadmill running',     tag: null },
  { label: 'Cross-country classic', sportType: 'Cross-country classic', tag: 'crosscountry_classic' },
  { label: 'Cross-country skate',   sportType: 'Cross-country skate',   tag: 'cr_skate' },
  { label: 'Rollerski classic',     sportType: 'Rollerski classic',     tag: 'rollerski_classic' },
  { label: 'Rollerski skate',       sportType: 'Rollerski skate',       tag: 'rollerski_skate' },
  { label: 'Treadmill classic',     sportType: 'Treadmill classic',     tag: 'treadmill_classic' },
  { label: 'Treadmill skate',       sportType: 'Treadmill skate',       tag: 'treadmill_skate' },
  { label: 'Imitation',             sportType: 'Imitation',             tag: null },
  { label: 'Cycling',               sportType: 'Cycling',               tag: null },
  { label: 'Strength',              sportType: 'Strength',              tag: null },
  { label: 'Basic strength',        sportType: 'Basic strength',        tag: 'strength_basic' },
  { label: 'Other',                 sportType: 'Other',                 tag: null },
]

const ZONE_LABELS: { key: keyof ZoneMins; label: string }[] = [
  { key: 'z0', label: 'Z0 (easy/recovery)' },
  { key: 'z1', label: 'Z1' },
  { key: 'z2', label: 'Z2' },
  { key: 'z3', label: 'Z3' },
  { key: 'z4', label: 'Z4' },
  { key: 'z5', label: 'Z5 (hard)' },
]

interface ZoneMins {
  z0: number; z1: number; z2: number; z3: number; z4: number; z5: number
}

function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface ManualActivityModalProps {
  onClose: () => void
}

export function ManualActivityModal({ onClose }: ManualActivityModalProps) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState(MANUAL_SPORT_OPTIONS[0])
  const [date, setDate] = useState(todayString())
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning')
  const [hours, setHours] = useState(1)
  const [minutes, setMinutes] = useState(0)
  const [intensityType, setIntensityType] = useState<'regular' | 'interval' | 'speed' | 'competition'>('regular')
  const [showZones, setShowZones] = useState(false)
  const [zoneMins, setZoneMins] = useState<ZoneMins>({ z0: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateZone(key: keyof ZoneMins, value: number) {
    setZoneMins((prev) => ({ ...prev, [key]: Math.max(0, value) }))
  }

  async function handleSave() {
    setError(null)
    const duration_seconds = hours * 3600 + minutes * 60
    if (duration_seconds <= 0) {
      setError('Duration must be greater than 0')
      return
    }

    const hasZoneData = showZones && Object.values(zoneMins).some((v) => v > 0)
    const manual_zone_seconds = hasZoneData
      ? {
          z0: zoneMins.z0 * 60,
          z1: zoneMins.z1 * 60,
          z2: zoneMins.z2 * 60,
          z3: zoneMins.z3 * 60,
          z4: zoneMins.z4 * 60,
          z5: zoneMins.z5 * 60,
        }
      : null

    setSaving(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_type: selectedOption.sportType,
          custom_sport_tag: selectedOption.tag,
          date,
          time_of_day: timeOfDay,
          duration_seconds,
          intensity_type: intensityType,
          notes: notes || null,
          manual_zone_seconds,
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
            value={selectedOption.sportType}
            onChange={(e) => {
              const opt = MANUAL_SPORT_OPTIONS.find((o) => o.sportType === e.target.value)
              if (opt) setSelectedOption(opt)
            }}
            className="w-full border border-[#e5e5e5] rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            {MANUAL_SPORT_OPTIONS.map((o) => (
              <option key={o.sportType} value={o.sportType}>{o.label}</option>
            ))}
          </select>
        </div>

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

        {/* Zone breakdown toggle */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
          >
            {showZones ? 'Hide zone breakdown' : '+ Add zone breakdown'}
          </button>

          {showZones && (
            <div className="space-y-2 p-3 border border-[#e5e5e5] rounded-md bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Time per zone (minutes)</p>
              {ZONE_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={zoneMins[key]}
                    onChange={(e) => updateZone(key, parseInt(e.target.value) || 0)}
                    className="w-16 border border-[#e5e5e5] rounded px-2 py-1 text-sm text-gray-900 text-center focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
