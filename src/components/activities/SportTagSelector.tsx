'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CUSTOM_SPORT_TAGS, CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'

const SKIING_SPORT_TYPES = ['NordicSki', 'BackcountrySki']
const SKIING_OVERRIDE_TYPES = [
  'Skiing', 'Rollerski',
  'crosscountry_classic', 'cr_skate',
  'rollerski_classic', 'rollerski_skate',
  'treadmill_classic', 'treadmill_skate',
]
const SKIING_TAGS = CUSTOM_SPORT_TAGS.filter((t) => t !== 'strength_basic')

interface SportTagSelectorProps {
  activityId: string
  currentTag: string | null
  sportType: string
  overriddenSportType?: string | null
  onChanged?: (tag: string | null) => void
}

export function SportTagSelector({ activityId, currentTag, sportType, overriddenSportType, onChanged }: SportTagSelectorProps) {
  const [tag, setTag] = useState<string | null>(currentTag)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const isSkiingContext =
    SKIING_OVERRIDE_TYPES.includes(overriddenSportType ?? '') ||
    (overriddenSportType == null && SKIING_SPORT_TYPES.includes(sportType))

  // Auto-clear tag when sport is no longer skiing
  useEffect(() => {
    if (!isSkiingContext && tag !== null) {
      fetch(`/api/activity/${activityId}/tag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_sport_tag: null }),
      }).catch(() => {})
      setTag(null)
      onChanged?.(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSkiingContext])

  if (!isSkiingContext) return null

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
    <div className="flex flex-col gap-1.5">
      <select
        value={tag ?? ''}
        onChange={(e) => handleChange(e.target.value || null)}
        disabled={saving}
        className="border border-atlas-rule bg-transparent text-atlas-ink font-serif text-[13px] px-2 py-1 focus:outline-none focus:border-atlas-muted appearance-none disabled:opacity-50"
      >
        <option value="">Skiing (untagged)</option>
        {SKIING_TAGS.map((t) => (
          <option key={t} value={t}>
            {CUSTOM_SPORT_TAG_LABELS[t as CustomSportTag]}
          </option>
        ))}
      </select>
      {saving && (
        <p className="font-mono text-[9px] text-atlas-faint">Saving…</p>
      )}
    </div>
  )
}
