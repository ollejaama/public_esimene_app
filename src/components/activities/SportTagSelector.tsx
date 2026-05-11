'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CUSTOM_SPORT_TAGS, CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'

interface SportTagSelectorProps {
  activityId: string
  currentTag: string | null
  sportType: string
  onChanged?: (tag: string | null) => void
}

export function SportTagSelector({ activityId, currentTag, sportType, onChanged }: SportTagSelectorProps) {
  const [tag, setTag] = useState<string | null>(currentTag)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Only show for Nordic Ski activities
  if (sportType !== 'NordicSki' && sportType !== 'BackcountrySki') return null

  async function handleChange(newTag: string | null) {
    setSaving(true)
    await fetch(`/api/activity/${activityId}/tag`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_sport_tag: newTag }),
    })
    setTag(newTag)
    setSaving(false)
    if (onChanged) {
      onChanged(newTag)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-500">Tag:</span>
      <select
        value={tag ?? ''}
        onChange={(e) => handleChange(e.target.value || null)}
        disabled={saving}
        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
      >
        <option value="">Skiing (untagged)</option>
        {CUSTOM_SPORT_TAGS.filter((t) => t !== 'strength_basic').map((t) => (
          <option key={t} value={t}>
            {CUSTOM_SPORT_TAG_LABELS[t as CustomSportTag]}
          </option>
        ))}
      </select>
      {saving && <span className="text-xs text-gray-400">Saving…</span>}
    </div>
  )
}
