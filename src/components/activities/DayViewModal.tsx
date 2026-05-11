'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Activity } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveDuration, effectiveSportKey, getActivityTitle } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SportIcon } from '@/components/ui/SportIcon'

interface DayViewModalProps {
  date: Date
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
  onClose: () => void
}

function getSportColor(activity: Activity): string {
  const key = effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

export function DayViewModal({ date, activities, onActivityClick, onClose }: DayViewModalProps) {
  const dateLabel = date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteValues, setNoteValues] = useState<Record<string, string>>(
    Object.fromEntries(activities.map((a) => [a.id, a.notes ?? '']))
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  async function handleNoteBlur(activityId: string) {
    const current = noteValues[activityId] ?? ''
    setSavingId(activityId)
    await fetch(`/api/activity/${activityId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: current }),
    })
    setSavingId(null)
    setEditingId(null)
  }

  const morning = activities.filter((a) => new Date(a.start_date).getHours() < 14)
  const evening = activities.filter((a) => new Date(a.start_date).getHours() >= 14)

  function ActivityRow({ activity }: { activity: Activity }) {
    const color = getSportColor(activity)
    const noteValue = noteValues[activity.id] ?? ''
    const isEditing = editingId === activity.id
    const isSaving = savingId === activity.id

    return (
      <div className="rounded-lg hover:bg-gray-50 transition-colors">
        <button
          onClick={() => onActivityClick(activity)}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5"
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <SportIcon sportKey={effectiveSportKey(activity)} className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-medium text-gray-900 truncate">{getActivityTitle(activity)}</p>
              {activity.intensity_type === 'interval' && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-600 leading-none flex-shrink-0">INT</span>
              )}
              {activity.intensity_type === 'speed' && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-600 leading-none flex-shrink-0">SPD</span>
              )}
              {activity.intensity_type === 'competition' && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none flex-shrink-0">★ COMP</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{formatDuration(effectiveDuration(activity))}</p>
          </div>
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Notes section */}
        <div className="px-3 pb-2.5">
          {isEditing ? (
            <div className="mt-0.5">
              <textarea
                autoFocus
                value={noteValue}
                onChange={(e) => setNoteValues((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                onBlur={() => handleNoteBlur(activity.id)}
                rows={3}
                placeholder="Add a note…"
                className="w-full text-xs text-gray-700 border border-gray-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
              {isSaving && <p className="text-[10px] text-gray-400 mt-0.5">Saving…</p>}
            </div>
          ) : (
            <button
              onClick={() => setEditingId(activity.id)}
              className="w-full text-left"
            >
              {noteValue ? (
                <p className="text-xs text-gray-500 italic line-clamp-2 hover:text-gray-700 transition-colors">{noteValue}</p>
              ) : (
                <p className="text-xs text-gray-300 hover:text-gray-500 transition-colors">+ Add note</p>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm" align="center">
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5 pr-6">{dateLabel}</h2>

        <div className="space-y-4">
          {morning.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 px-1">
                ☀ Morning
              </p>
              <div className="space-y-0.5">
                {morning.map((a) => <ActivityRow key={a.id} activity={a} />)}
              </div>
            </div>
          )}

          {evening.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 px-1">
                ☽ Evening
              </p>
              <div className="space-y-0.5">
                {evening.map((a) => <ActivityRow key={a.id} activity={a} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
