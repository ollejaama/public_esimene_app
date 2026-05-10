'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Activity } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveDuration, effectiveSportKey, getActivityTitle } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SportIcon } from '@/components/ui/SportIcon'

interface ActivityPreviewModalProps {
  activity: Activity
  onClose: () => void
  onExpand: () => void
}

function getSportColor(activity: Activity): string {
  const key = effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function ActivityPreviewModal({ activity, onClose, onExpand }: ActivityPreviewModalProps) {
  const [noteValue, setNoteValue] = useState(activity.notes ?? '')
  const [editingNote, setEditingNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const color = getSportColor(activity)

  async function handleNoteBlur() {
    setSavingNote(true)
    await fetch(`/api/activity/${activity.id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteValue }),
    })
    setSavingNote(false)
    setEditingNote(false)
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm" align="center">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3 pr-6">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <SportIcon sportKey={effectiveSportKey(activity)} className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{getActivityTitle(activity)}</h2>
              {activity.intensity_type === 'interval' && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-600 leading-none flex-shrink-0">INT</span>
              )}
              {activity.intensity_type === 'speed' && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-600 leading-none flex-shrink-0">SPD</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.start_date)}</p>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-4 px-1">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Duration</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{formatDuration(effectiveDuration(activity))}</p>
          </div>
          {activity.distance > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Distance</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{(activity.distance / 1000).toFixed(2)} km</p>
            </div>
          )}
          {activity.average_hr && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Avg HR</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{Math.round(activity.average_hr)} bpm</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1.5 px-1">Notes</p>
          {editingNote ? (
            <div>
              <textarea
                autoFocus
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onBlur={handleNoteBlur}
                rows={3}
                placeholder="Add a note…"
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
              />
              {savingNote && <p className="text-xs text-gray-400 mt-1">Saving…</p>}
            </div>
          ) : (
            <button
              onClick={() => setEditingNote(true)}
              className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 transition-colors"
            >
              {noteValue ? (
                <p className="text-sm text-gray-700">{noteValue}</p>
              ) : (
                <p className="text-sm text-gray-300">+ Add note</p>
              )}
            </button>
          )}
        </div>

        {/* Expand button */}
        <div className="pt-1">
          <button
            onClick={onExpand}
            className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Open full view ↗
          </button>
        </div>
      </div>
    </Modal>
  )
}
