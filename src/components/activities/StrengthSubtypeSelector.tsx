'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SPORT_TYPE_MAP } from '@/lib/constants'

interface StrengthSubtypeSelectorProps {
  activityId: string
  currentTag: string | null
  sportType: string
}

export function StrengthSubtypeSelector({ activityId, currentTag, sportType }: StrengthSubtypeSelectorProps) {
  const [tag, setTag] = useState<string | null>(currentTag)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // Only show for Strength activities
  if (SPORT_TYPE_MAP[sportType] !== 'Strength') return null

  async function handleClick(newTag: string | null) {
    if (newTag === tag || saving) return
    setSaving(true)
    await fetch(`/api/activity/${activityId}/tag`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_sport_tag: newTag }),
    })
    setTag(newTag)
    setSaving(false)
    router.refresh()
  }

  const isBasic = tag === 'strength_basic'

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-500">Type:</span>
      <div className="flex gap-1.5">
        <button
          onClick={() => handleClick(null)}
          disabled={saving}
          className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-50 ${
            !isBasic
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
          }`}
        >
          Regular
        </button>
        <button
          onClick={() => handleClick('strength_basic')}
          disabled={saving}
          className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-50 ${
            isBasic
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-[#e5e5e5] hover:border-gray-400'
          }`}
        >
          Basic
        </button>
      </div>
      {saving && <span className="text-xs text-gray-400">Saving…</span>}
    </div>
  )
}
