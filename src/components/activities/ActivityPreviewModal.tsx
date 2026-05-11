'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Activity } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveDuration, effectiveSportKey, getActivityTitle } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SportIcon } from '@/components/ui/SportIcon'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'

interface ActivityPreviewModalProps {
  activity: Activity
  onClose: () => void
  onExpand: () => void
}

function getSportColor(activity: Activity, customTag?: string | null): string {
  const key = customTag ?? effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function ActivityPreviewModal({ activity, onClose, onExpand }: ActivityPreviewModalProps) {
  const router = useRouter()
  const [noteValue, setNoteValue] = useState(activity.notes ?? '')
  const [editingNote, setEditingNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [hidden, setHidden] = useState(activity.hidden)
  const [savingHidden, setSavingHidden] = useState(false)
  const [customTag, setCustomTag] = useState<string | null>(activity.custom_sport_tag)

  const color = getSportColor(activity, customTag)
  const isStrength = effectiveSportKey(activity) === 'Strength' || effectiveSportKey(activity) === 'strength_basic'

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

  async function handleToggleHidden() {
    setSavingHidden(true)
    const newHidden = !hidden
    await fetch(`/api/activity/${activity.id}/hidden`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: newHidden }),
    })
    setHidden(newHidden)
    setSavingHidden(false)
    router.refresh()
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm" align="center">
      <div className="p-5 space-y-4">
        {/* Hidden banner */}
        {hidden && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-gray-100 text-gray-500 text-xs">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            Hidden — not counted in statistics or visible to coach
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 pr-6">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <SportIcon sportKey={customTag ?? effectiveSportKey(activity)} className="w-5 h-5" />
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
              {activity.intensity_type === 'competition' && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none flex-shrink-0">★ COMP</span>
              )}
              {activity.is_manual && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none flex-shrink-0">manual</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.start_date)}</p>
          </div>
        </div>

        {/* Strength subtype selector */}
        {isStrength && (
          <StrengthSubtypeSelector
            activityId={activity.id}
            currentTag={customTag}
            sportType={activity.sport_type}
            onChanged={(tag) => setCustomTag(tag)}
          />
        )}

        {/* Duration */}
        <div className="flex items-center gap-4 px-1">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Duration</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-sm font-semibold text-gray-800">{formatDuration(effectiveDuration(activity))}</p>
              {activity.contribution_hours != null && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none">
                  {activity.contribution_hours}h counted
                </span>
              )}
            </div>
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

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            onClick={handleToggleHidden}
            disabled={savingHidden}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {hidden ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Unhide
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                Hide
              </>
            )}
          </button>
          <button
            onClick={onExpand}
            className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Open full view ↗
          </button>
        </div>
      </div>
    </Modal>
  )
}
