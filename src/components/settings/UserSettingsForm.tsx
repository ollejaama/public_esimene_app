'use client'

import { useState } from 'react'
import { UserSettings } from '@/lib/supabase/types'

type PartialSettings = Pick<UserSettings, 'show_rpe' | 'show_lactate'>

interface UserSettingsFormProps {
  initial: PartialSettings
}

export function UserSettingsForm({ initial }: UserSettingsFormProps) {
  const [settings, setSettings] = useState<PartialSettings>(initial)
  const [saving, setSaving] = useState(false)

  async function save(next: PartialSettings) {
    setSettings(next)
    setSaving(true)
    await fetch('/api/settings/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      {/* Feeling toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">Feeling</p>
          <p className="text-xs text-gray-400 mt-0.5">Log how good the training felt (1–10)</p>
        </div>
        <button
          onClick={() => save({ ...settings, show_rpe: !settings.show_rpe })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            settings.show_rpe ? 'bg-gray-900' : 'bg-gray-200'
          }`}
          aria-pressed={settings.show_rpe}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
              settings.show_rpe ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Lactate toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">Lactate Tracking</p>
          <p className="text-xs text-gray-400 mt-0.5">Log blood lactate measurements per session</p>
        </div>
        <button
          onClick={() => save({ ...settings, show_lactate: !settings.show_lactate })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            settings.show_lactate ? 'bg-gray-900' : 'bg-gray-200'
          }`}
          aria-pressed={settings.show_lactate}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
              settings.show_lactate ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {saving && <p className="text-xs text-gray-400">Saving…</p>}
    </div>
  )
}
