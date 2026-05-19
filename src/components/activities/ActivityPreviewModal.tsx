'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Activity, LactateMeasurement } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveDuration, effectiveSportKey, getActivityTitle } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { SportIcon } from '@/components/ui/SportIcon'
import { ActivityTypeBadge } from '@/components/ui/ActivityTypeBadge'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'
import { SportTagSelector } from './SportTagSelector'
import { IntensityEditor } from './IntensityEditor'
import { IntervalSetupModal } from './IntervalSetupModal'
import { RPEInput } from './RPEInput'
import { LactateInput } from './LactateInput'

interface ActivityPreviewModalProps {
  activity: Activity
  onClose: () => void
  onExpand: () => void
  isCoach?: boolean
  showRPE?: boolean
  rpeScale?: 'rpe' | 'borg'
  showLactate?: boolean
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

export function ActivityPreviewModal({ activity, onClose, onExpand, isCoach = false, showRPE = false, rpeScale = 'rpe', showLactate = false }: ActivityPreviewModalProps) {
  const router = useRouter()
  const [noteValue, setNoteValue] = useState(activity.notes ?? '')
  const [editingNote, setEditingNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [hidden, setHidden] = useState(activity.hidden)
  const [savingHidden, setSavingHidden] = useState(false)
  const [customTag, setCustomTag] = useState<string | null>(activity.custom_sport_tag)
  const [showIntervalModal, setShowIntervalModal] = useState(false)

  // Coach comment state
  const [commentValue, setCommentValue] = useState(activity.coach_comment ?? '')
  const [editingComment, setEditingComment] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [heartActive, setHeartActive] = useState(activity.athlete_heart)

  // Lactate state (fetched lazily when showLactate is on)
  const [lactate, setLactate] = useState<LactateMeasurement[] | null>(null)

  useEffect(() => {
    // Mark comment as read when athlete opens activity with unread comment
    if (!isCoach && activity.coach_comment_unread) {
      fetch(`/api/activity/${activity.id}/mark-comment-read`, { method: 'PATCH' })
    }
    // Mark heart as read when coach opens activity with unread heart
    if (isCoach && activity.athlete_heart_unread) {
      fetch(`/api/activity/${activity.id}/mark-heart-read`, { method: 'PATCH' })
    }
  }, [activity.id, isCoach, activity.coach_comment_unread, activity.athlete_heart_unread])

  useEffect(() => {
    if (showLactate && lactate === null) {
      fetch(`/api/activity/${activity.id}/lactate`)
        .then(r => r.json())
        .then(setLactate)
    }
  }, [showLactate, activity.id, lactate])

  async function handleSaveComment() {
    setSavingComment(true)
    await fetch(`/api/activity/${activity.id}/coach-comment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_comment: commentValue }),
    })
    setSavingComment(false)
    setEditingComment(false)
    router.refresh()
  }

  async function handleToggleHeart() {
    const next = !heartActive
    setHeartActive(next)
    await fetch(`/api/activity/${activity.id}/athlete-heart`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_heart: next }),
    })
    router.refresh()
  }

  const color = getSportColor(activity, customTag)
  const isStrength = effectiveSportKey(activity) === 'Strength' || effectiveSportKey(activity) === 'strength_basic'
  const isSkiing = activity.sport_type === 'NordicSki' || activity.sport_type === 'BackcountrySki'

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
              {(activity.intensity_type === 'interval' || activity.intensity_type === 'speed' || activity.intensity_type === 'competition') && (
                <ActivityTypeBadge intensityType={activity.intensity_type} />
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

        {/* Skiing subtype selector */}
        {isSkiing && (
          <SportTagSelector
            activityId={activity.id}
            currentTag={customTag}
            sportType={activity.sport_type}
            onChanged={(tag) => setCustomTag(tag)}
          />
        )}

        {/* Intensity */}
        {!isStrength && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1.5 px-1">Intensity</p>
            <IntensityEditor
              activityId={activity.id}
              initialValue={activity.intensity_type}
              onChanged={(val) => {
                if (val === 'interval') setShowIntervalModal(true)
              }}
            />
          </div>
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

        {/* RPE */}
        {showRPE && (
          <RPEInput activityId={activity.id} initialValue={activity.rpe} scale={rpeScale} />
        )}

        {/* Coach comment */}
        {isCoach ? (
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Coach comment</p>
              {heartActive && (
                <span className="text-sm" title="Athlete liked this">
                  ❤️{activity.athlete_heart_unread && <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-top mt-0.5" />}
                </span>
              )}
            </div>
            {editingComment ? (
              <div>
                <textarea
                  autoFocus
                  value={commentValue}
                  onChange={(e) => setCommentValue(e.target.value)}
                  rows={3}
                  placeholder="Add a comment for the athlete…"
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={handleSaveComment}
                    disabled={savingComment}
                    className="flex-1 bg-gray-900 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {savingComment ? 'Saving…' : 'Save comment'}
                  </button>
                  <button
                    onClick={() => { setEditingComment(false); setCommentValue(activity.coach_comment ?? '') }}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingComment(true)}
                className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 transition-colors"
              >
                {commentValue ? (
                  <p className="text-sm text-gray-700">{commentValue}</p>
                ) : (
                  <p className="text-sm text-gray-300">+ Add comment for athlete</p>
                )}
              </button>
            )}
          </div>
        ) : activity.coach_comment ? (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1.5 px-1">Coach</p>
            <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-start gap-2">
              <p className="text-sm text-blue-900 flex-1">{activity.coach_comment}</p>
              <button
                onClick={handleToggleHeart}
                className="flex-shrink-0 text-base leading-none transition-transform hover:scale-110"
                aria-label={heartActive ? 'Remove heart' : 'Heart this comment'}
              >
                {heartActive ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Lactate */}
        {showLactate && (
          lactate !== null
            ? <LactateInput activityId={activity.id} initialValues={lactate} />
            : <p className="text-xs text-gray-300 px-1">Loading lactate…</p>
        )}

        {showIntervalModal && (
          <IntervalSetupModal
            activityId={activity.id}
            onClose={() => setShowIntervalModal(false)}
          />
        )}

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
