'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { SportIcon } from '@/components/ui/SportIcon'
import { ActivityContent } from './ActivityContent'
import { SportTagSelector } from './SportTagSelector'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'
import { ContributionEditor } from './ContributionEditor'
import { HideToggle } from './HideToggle'
import { RPEInput } from './RPEInput'
import { LactateInput } from './LactateInput'
import { Activity, ActivityLap, LactateMeasurement } from '@/lib/supabase/types'
import { ZoneRow } from '@/lib/analytics/hrZones'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveSportKey, getActivityTitle } from '@/lib/activity'
import { ActivityTypeBadge } from '@/components/ui/ActivityTypeBadge'
import { IntervalSetsSection } from './IntervalSetsSection'
import { IntervalSetupModal } from './IntervalSetupModal'
import { NotesEditor } from './NotesEditor'

interface ActivityExpandedModalProps {
  activityId: string
  onClose: () => void
  isCoach?: boolean
  showRPE?: boolean
  rpeScale?: 'rpe' | 'borg'
  showLactate?: boolean
}

interface ZoneBoundaries {
  zone1_max: number
  zone2_max: number
  zone3_max: number
  zone4_max: number
}

interface ActivityDetail {
  activity: Activity
  zoneRows: ZoneRow[]
  latlng: [number, number][] | null
  elevation: number[] | null
  hrData: number[] | null
  laps: ActivityLap[]
  zoneBoundaries: ZoneBoundaries
  lactate: LactateMeasurement[]
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

export function ActivityExpandedModal({ activityId, onClose, isCoach = false, showRPE = false, rpeScale = 'rpe', showLactate = false }: ActivityExpandedModalProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localIntensityType, setLocalIntensityType] = useState<string | null>(null)
  const [showIntervalModal, setShowIntervalModal] = useState(false)

  // Coach comment state
  const [commentValue, setCommentValue] = useState('')
  const [editingComment, setEditingComment] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [heartActive, setHeartActive] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/activity/${activityId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data)
        setLocalIntensityType(data.activity?.intensity_type ?? null)
        setCommentValue(data.activity?.coach_comment ?? '')
        setHeartActive(data.activity?.athlete_heart ?? false)
        setLoading(false)
        // Mark read flags
        if (!isCoach && data.activity?.coach_comment_unread) {
          fetch(`/api/activity/${activityId}/mark-comment-read`, { method: 'PATCH' })
        }
        if (isCoach && data.activity?.athlete_heart_unread) {
          fetch(`/api/activity/${activityId}/mark-heart-read`, { method: 'PATCH' })
        }
      })
      .catch(() => {
        setError('Failed to load activity.')
        setLoading(false)
      })
  }, [activityId, isCoach])

  async function handleSaveComment() {
    setSavingComment(true)
    await fetch(`/api/activity/${activityId}/coach-comment`, {
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
    await fetch(`/api/activity/${activityId}/athlete-heart`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_heart: next }),
    })
    router.refresh()
  }

  function handleTagChanged(tag: string | null) {
    setDetail((prev) =>
      prev ? { ...prev, activity: { ...prev.activity, custom_sport_tag: tag } } : prev
    )
    router.refresh()
  }

  const activity = detail?.activity
  const color = activity ? getSportColor(activity, activity.custom_sport_tag) : '#aaa'
  const sportKey = activity ? (activity.custom_sport_tag ?? effectiveSportKey(activity)) : 'Other'
  const activitySeconds = activity ? (activity.moving_time ?? activity.elapsed_time) : 0

  return (
    <Modal open onClose={onClose} maxWidth="max-w-5xl">
      <div className="p-6">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner className="w-6 h-6" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {detail && activity && !loading && (
          <div className="space-y-5">
            {/* Header — popup aesthetic with sport icon and color */}
            <div className="flex items-start gap-4 pr-8">
              <span
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}20`, color }}
              >
                <SportIcon sportKey={sportKey} className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-gray-900">{getActivityTitle(activity)}</h2>
                  {(activity.intensity_type === 'interval' || activity.intensity_type === 'speed' || activity.intensity_type === 'competition') && (
                    <ActivityTypeBadge intensityType={activity.intensity_type} />
                  )}
                  {activity.hidden && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-200 text-gray-500 leading-none flex-shrink-0">hidden</span>
                  )}
                  {activity.is_manual && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none flex-shrink-0">manual</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(activity.start_date)}</p>
              </div>
            </div>

            <SportTagSelector
              activityId={activity.id}
              currentTag={activity.custom_sport_tag}
              sportType={activity.sport_type}
              onChanged={handleTagChanged}
            />
            <StrengthSubtypeSelector
              activityId={activity.id}
              currentTag={activity.custom_sport_tag}
              sportType={activity.sport_type}
              onChanged={handleTagChanged}
            />

            <div className="border border-[#e5e5e5] rounded-lg p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h2>
              <NotesEditor activityId={activity.id} initialNotes={activity.notes} />
            </div>

            <ActivityContent
              activity={activity}
              zoneRows={detail.zoneRows}
              latlng={detail.latlng ?? []}
              hrData={detail.hrData}
              laps={detail.laps}
              activitySeconds={activitySeconds}
              showHRChart={true}
              elevationData={detail.elevation}
              zoneBoundaries={detail.zoneBoundaries}
              showDangerControls={false}
              onIntensityChange={(val) => {
                setLocalIntensityType(val)
                if (val === 'interval') setShowIntervalModal(true)
              }}
            />

            {localIntensityType === 'interval' && (
              <IntervalSetsSection
                activityId={activityId}
                zoneRows={detail.zoneRows}
                hasHRData={!!detail.hrData && detail.hrData.length > 0}
              />
            )}

            {showIntervalModal && (
              <IntervalSetupModal
                activityId={activityId}
                onClose={() => setShowIntervalModal(false)}
                onSaved={() => setShowIntervalModal(false)}
              />
            )}

            {/* RPE */}
            {showRPE && detail.activity && (
              <div className="border border-[#e5e5e5] rounded-lg p-5">
                <RPEInput activityId={detail.activity.id} initialValue={detail.activity.rpe} scale={rpeScale} />
              </div>
            )}

            {/* Lactate */}
            {showLactate && (
              <div className="border border-[#e5e5e5] rounded-lg p-5">
                <LactateInput activityId={activityId} initialValues={detail.lactate ?? []} />
              </div>
            )}

            {/* Coach comment */}
            {isCoach ? (
              <div className="border border-[#e5e5e5] rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coach comment</h2>
                  {heartActive && (
                    <span className="text-base" title="Athlete liked this">
                      ❤️{detail.activity?.athlete_heart_unread && <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-top mt-0.5" />}
                    </span>
                  )}
                </div>
                {editingComment ? (
                  <div>
                    <textarea
                      autoFocus
                      value={commentValue}
                      onChange={(e) => setCommentValue(e.target.value)}
                      rows={4}
                      placeholder="Add a comment for the athlete…"
                      className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveComment}
                        disabled={savingComment}
                        className="flex-1 bg-gray-900 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {savingComment ? 'Saving…' : 'Save comment'}
                      </button>
                      <button
                        onClick={() => { setEditingComment(false); setCommentValue(detail.activity?.coach_comment ?? '') }}
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
            ) : detail.activity?.coach_comment ? (
              <div className="border border-[#e5e5e5] rounded-lg p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Coach</h2>
                <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <p className="text-sm text-blue-900 flex-1">{detail.activity.coach_comment}</p>
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

            {/* Controls — intentionally at the bottom, require scrolling */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <ContributionEditor
                activityId={activity.id}
                initialHours={activity.contribution_hours ?? null}
              />
              {!isCoach && (
                <HideToggle
                  activityId={activity.id}
                  initialHidden={activity.hidden}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
