'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
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

const SPORT_GLYPHS: Record<string, string> = {
  ski_classic: '╱╱', ski_skate: '╳╳',
  rollerski_classic: '╱·', rollerski_skate: '╳·',
  run: '↗', strength: '◼', basic_strength: '◻',
  cycling: '◯', treadmill: '═', imitation: '·',
  Running: '↗', Skiing: '╱╱', Rollerski: '╱·',
  Strength: '◼', Cycling: '◯', Treadmill: '═', Imitation: '·',
}

function getSportColor(activity: Activity, customTag?: string | null): string {
  const key = customTag ?? effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

function getSportGlyph(activity: Activity, customTag?: string | null): string {
  return SPORT_GLYPHS[customTag ?? '']
    ?? SPORT_GLYPHS[effectiveSportKey(activity)]
    ?? '·'
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function IntensityBadge({ type }: { type: string | null }) {
  if (type === 'interval') {
    return (
      <span className="atlas-pill-interval border border-atlas-accent font-mono text-[9px] tracking-[0.15em] uppercase px-[7px] py-[3px] text-atlas-accent font-semibold">
        Interval
      </span>
    )
  }
  if (type === 'speed') {
    return (
      <span className="atlas-badge-speed border font-mono text-[9px] tracking-[0.15em] uppercase px-[7px] py-[3px] font-semibold">
        Speed
      </span>
    )
  }
  if (type === 'competition') {
    return (
      <span className="atlas-badge-competition border font-mono text-[9px] tracking-[0.15em] uppercase px-[7px] py-[3px] font-semibold">
        Competition
      </span>
    )
  }
  return null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-atlas-muted mb-2">
      {children}
    </p>
  )
}

export function ActivityExpandedModal({ activityId, onClose, isCoach = false, showRPE = false, rpeScale = 'rpe', showLactate = false }: ActivityExpandedModalProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localIntensityType, setLocalIntensityType] = useState<string | null>(null)
  const [showIntervalModal, setShowIntervalModal] = useState(false)
  const [customTag, setCustomTag] = useState<string | null>(null)
  const [overriddenSportType, setOverriddenSportType] = useState<string | null>(null)

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
        setCustomTag(data.activity?.custom_sport_tag ?? null)
        setOverriddenSportType(data.activity?.overridden_sport_type ?? null)
        setCommentValue(data.activity?.coach_comment ?? '')
        setHeartActive(data.activity?.athlete_heart ?? false)
        setLoading(false)
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
    setCustomTag(tag)
    setDetail((prev) =>
      prev ? { ...prev, activity: { ...prev.activity, custom_sport_tag: tag } } : prev
    )
    router.refresh()
  }

  const activity = detail?.activity
  const color = activity ? getSportColor(activity, customTag) : '#aaa'
  const glyph = activity ? getSportGlyph(activity, customTag) : '·'
  const activitySeconds = activity ? (activity.moving_time ?? activity.elapsed_time) : 0

  return (
    <Modal open onClose={onClose} maxWidth="max-w-[1120px]" hideCloseButton>
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6" />
        </div>
      )}
      {error && (
        <p className="font-mono text-[11px] text-atlas-accent p-6">{error}</p>
      )}

      {detail && activity && !loading && (
        <>
          {/* ── Header band ───────────────────────────────────── */}
          <div className="flex items-start gap-4 border-b border-atlas-rule bg-atlas-bg relative" style={{ padding: '24px 28px 18px' }}>
            <span
              className="shrink-0 flex items-center justify-center font-mono font-semibold border"
              style={{ width: 52, height: 52, backgroundColor: `${color}22`, borderColor: color, color, fontSize: 20 }}
            >
              {glyph}
            </span>
            <div className="flex-1 min-w-0 pr-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-[28px] font-normal tracking-[-0.02em] leading-[1.15] text-atlas-ink">
                  {getActivityTitle(activity)}
                </h2>
                <IntensityBadge type={localIntensityType} />
                {activity.is_manual && (
                  <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 text-atlas-muted bg-atlas-panel border border-atlas-rule">
                    manual
                  </span>
                )}
                {activity.hidden && (
                  <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 text-atlas-muted bg-atlas-panel border border-atlas-rule">
                    hidden
                  </span>
                )}
              </div>
              <p className="mt-1.5 font-serif italic text-[14px] text-atlas-muted leading-none">
                {formatDate(activity.start_date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* ── Body ──────────────────────────────────────────── */}
          <div className="space-y-5" style={{ padding: '20px 28px 28px' }}>
            <SportTagSelector
              activityId={activity.id}
              currentTag={customTag}
              sportType={activity.sport_type}
              overriddenSportType={overriddenSportType}
              onChanged={handleTagChanged}
            />
            <StrengthSubtypeSelector
              activityId={activity.id}
              currentTag={customTag}
              sportType={activity.sport_type}
              onChanged={handleTagChanged}
            />

            <div>
              <SectionLabel>Notes</SectionLabel>
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
              onSportTypeChanged={(val) => { setOverriddenSportType(val); router.refresh() }}
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

            {showRPE && detail.activity && (
              <div>
                <SectionLabel>RPE</SectionLabel>
                <RPEInput activityId={detail.activity.id} initialValue={detail.activity.rpe} scale={rpeScale} />
              </div>
            )}

            {showLactate && (
              <div>
                <SectionLabel>Lactate</SectionLabel>
                <LactateInput activityId={activityId} initialValues={detail.lactate ?? []} />
              </div>
            )}

            {isCoach ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>Coach comment</SectionLabel>
                  {heartActive && (
                    <span className="text-sm text-atlas-accent" title="Athlete liked this">
                      ♥{detail.activity?.athlete_heart_unread && (
                        <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-top mt-0.5" />
                      )}
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
                      className="w-full font-serif italic text-sm text-atlas-ink bg-transparent border border-atlas-rule px-3 py-2 resize-none focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint"
                    />
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={handleSaveComment}
                        disabled={savingComment}
                        className="bg-atlas-selected text-atlas-selectedFg font-mono text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {savingComment ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingComment(false); setCommentValue(detail.activity?.coach_comment ?? '') }}
                        className="font-mono text-[10px] tracking-[0.1em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingComment(true)}
                    className="w-full text-left border border-dashed border-atlas-rule hover:border-atlas-faint transition-colors"
                    style={{ padding: '10px 12px', minHeight: 56 }}
                  >
                    {commentValue
                      ? <p className="font-serif italic text-sm text-atlas-ink">{commentValue}</p>
                      : <p className="font-serif italic text-[13px] text-atlas-faint">+ Add comment for athlete</p>
                    }
                  </button>
                )}
              </div>
            ) : detail.activity?.coach_comment ? (
              <div>
                <SectionLabel>Coach</SectionLabel>
                <div className="atlas-coach-card border border-atlas-rule border-l-2 border-l-atlas-accent flex items-start gap-3" style={{ padding: '12px 14px' }}>
                  <div className="flex-1">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-accent mb-1">Coach</p>
                    <p className="font-serif text-sm leading-[1.55] text-atlas-ink">{detail.activity.coach_comment}</p>
                  </div>
                  <button
                    onClick={handleToggleHeart}
                    className="text-lg leading-none shrink-0 transition-colors"
                    style={{ color: heartActive ? 'var(--atlas-accent)' : 'var(--atlas-faint)' }}
                    aria-label={heartActive ? 'Remove heart' : 'Heart this comment'}
                  >
                    {heartActive ? '♥' : '♡'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="border-t border-atlas-rule pt-4 space-y-3">
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
        </>
      )}
    </Modal>
  )
}
