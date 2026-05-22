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
  apiBase?: string // defaults to /api/planned-activities
  extraBody?: Record<string, unknown> // merged into POST body (e.g. teamId)
}

export function PlanActivityModal({ mode, date, activity, initialTimeOfDay = 'morning', onClose, onSaved, initialIsRestDay, onToggleRestDay, apiBase = '/api/planned-activities', extraBody }: PlanActivityModalProps) {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>(activity?.time_of_day ?? initialTimeOfDay)
  const [intensityType, setIntensityType] = useState<'regular' | 'interval' | 'speed' | 'competition'>(activity?.intensity_type ?? 'regular')
  const [sportType, setSportType] = useState(activity?.sport_type ?? PLANNED_SPORT_TYPES[0])
  const [hours, setHours] = useState(activity ? Math.floor(activity.duration_minutes / 60) : 1)
  const [minutes, setMinutes] = useState(activity ? activity.duration_minutes % 60 : 0)
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

    const body = { date, sport_type: sportType, duration_minutes, description: description || null, time_of_day: timeOfDay, intensity_type: intensityType, ...extraBody }

    try {
      const res = mode === 'add'
        ? await fetch(apiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch(`${apiBase}/${activity!.id}`, {
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
      const res = await fetch(`${apiBase}/${activity.id}`, { method: 'DELETE' })
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
    <Modal open onClose={onClose} maxWidth="max-w-md" hideCloseButton>
      {/* Header band */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-atlas-rule">
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted">
            {mode === 'add' ? 'Plan · add session' : 'Plan · edit session'}
          </p>
          <h2 className="font-serif text-[20px] tracking-[-0.02em] text-atlas-ink mt-0.5">
            Planned training
          </h2>
          <p className="font-serif italic text-[12px] text-atlas-muted mt-0.5">{displayDate}</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {onToggleRestDay && mode === 'add' && (
            <button
              type="button"
              onClick={() => setIsRestDay((v) => !v)}
              className={`font-mono text-[9px] tracking-[0.1em] uppercase transition-colors ${isRestDay ? 'text-atlas-muted' : 'text-atlas-faint hover:text-atlas-muted'}`}
            >
              {isRestDay ? '🌙 rest day' : '○ rest day'}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {!isRestDay && (
          <>
            {/* Time of day */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Time</p>
              <div className="flex gap-1.5">
                {(['morning', 'evening'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTimeOfDay(val)}
                    className={`flex-1 font-mono text-[10px] tracking-[0.12em] uppercase py-[5px] border transition-colors ${
                      timeOfDay === val
                        ? 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected'
                        : 'bg-transparent text-atlas-ink border-atlas-rule hover:border-atlas-muted'
                    }`}
                  >
                    {val === 'morning' ? '☀ Morning' : '☽ Evening'}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity type */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Intensity</p>
              <div className="flex gap-1.5">
                {(['regular', 'interval', 'speed', 'competition'] as const).map((val) => {
                  const isComp = val === 'competition'
                  const active = intensityType === val
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setIntensityType(val)}
                      className={`flex-1 font-mono text-[10px] tracking-[0.08em] uppercase py-[5px] border transition-colors ${
                        active
                          ? isComp
                            ? 'bg-[#b8860b] text-[#f4ede0] border-[#b8860b]'
                            : 'bg-atlas-selected text-atlas-selectedFg border-atlas-selected'
                          : isComp
                            ? 'text-[#b8860b] border-atlas-rule hover:border-[#b8860b]'
                            : 'text-atlas-ink border-atlas-rule hover:border-atlas-muted'
                      }`}
                    >
                      {val === 'competition' ? '★ Comp' : val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sport type */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Sport</p>
              <select
                value={sportType}
                onChange={(e) => setSportType(e.target.value)}
                className="w-full border border-atlas-rule bg-transparent text-atlas-ink font-serif text-[13px] px-3 py-2 focus:outline-none focus:border-atlas-muted appearance-none"
              >
                {PLANNED_SPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Duration</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 border border-atlas-rule bg-transparent text-atlas-ink font-mono text-[13px] text-center py-2 focus:outline-none focus:border-atlas-muted"
                  />
                  <span className="font-mono text-[10px] text-atlas-muted">h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 border border-atlas-rule bg-transparent text-atlas-ink font-mono text-[13px] text-center py-2 focus:outline-none focus:border-atlas-muted"
                  />
                  <span className="font-mono text-[10px] text-atlas-muted">min</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-faint mb-2">Notes</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional notes…"
                className="w-full border border-atlas-rule bg-transparent text-atlas-ink font-serif text-[13px] px-3 py-2 resize-none focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint"
              />
            </div>
          </>
        )}

        {error && <p className="font-mono text-[10px] text-[#a23b2a]">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-atlas-rule">
          {mode === 'edit' ? (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#a23b2a] hover:opacity-70 transition-opacity disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : <span />}
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="font-mono text-[10px] tracking-[0.1em] uppercase bg-atlas-ink text-atlas-bg px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
