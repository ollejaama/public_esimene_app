'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Activity, LactateMeasurement } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveDuration, effectiveSportKey, getActivityTitle } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'
import { SportTagSelector } from './SportTagSelector'
import { IntensityEditor } from './IntensityEditor'
import { IntervalSetupModal } from './IntervalSetupModal'
import { FeelingInput } from './FeelingInput'
import { LactateInput } from './LactateInput'

interface ActivityPreviewModalProps {
  activity: Activity
  onClose: () => void
  onExpand: () => void
  isCoach?: boolean
  showFeeling?: boolean
  showLactate?: boolean
}

const SPORT_GLYPHS: Record<string, string> = {
  ski_classic: '╱╱', ski_skate: '╳╳',
  rollerski_classic: '╱·', rollerski_skate: '╳·',
  run: '↗', strength: '◼', basic_strength: '◻',
  cycling: '◯', treadmill: '═',
  Running: '↗', Skiing: '╱╱', Rollerski: '╱·',
  Strength: '◼', Cycling: '◯', Treadmill: '═',
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

export function ActivityPreviewModal({
  activity, onClose, onExpand,
  isCoach = false, showFeeling = false, showLactate = false,
}: ActivityPreviewModalProps) {
  const router = useRouter()
  const [noteValue, setNoteValue] = useState(activity.notes ?? '')
  const [editingNote, setEditingNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [hidden, setHidden] = useState(activity.hidden)
  const [savingHidden, setSavingHidden] = useState(false)
  const [customTag, setCustomTag] = useState<string | null>(activity.custom_sport_tag)
  const [showIntervalModal, setShowIntervalModal] = useState(false)

  const [commentValue, setCommentValue] = useState(activity.coach_comment ?? '')
  const [editingComment, setEditingComment] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [heartActive, setHeartActive] = useState(activity.athlete_heart)

  const [lactate, setLactate] = useState<LactateMeasurement[] | null>(null)

  useEffect(() => {
    if (!isCoach && activity.coach_comment_unread) {
      fetch(`/api/activity/${activity.id}/mark-comment-read`, { method: 'PATCH' })
    }
    if (isCoach && activity.athlete_heart_unread) {
      fetch(`/api/activity/${activity.id}/mark-heart-read`, { method: 'PATCH' })
    }
  }, [activity.id, isCoach, activity.coach_comment_unread, activity.athlete_heart_unread])

  useEffect(() => {
    if (showLactate && lactate === null) {
      fetch(`/api/activity/${activity.id}/lactate`).then(r => r.json()).then(setLactate)
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

  const color = getSportColor(activity, customTag)
  const glyph = getSportGlyph(activity, customTag)
  const isStrength = effectiveSportKey(activity) === 'Strength' || effectiveSportKey(activity) === 'strength_basic'
  const isSkiing =
    ['Skiing', 'Rollerski', 'crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate', 'treadmill_classic', 'treadmill_skate'].includes(activity.overridden_sport_type ?? '') ||
    (activity.overridden_sport_type == null && ['NordicSki', 'BackcountrySki'].includes(activity.sport_type))

  return (
    <Modal open onClose={onClose} maxWidth="max-w-[440px]" align="center" hideCloseButton>
      {/* ── Header band ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3 border-b border-atlas-rule bg-atlas-bg relative" style={{ padding: '20px 22px 14px' }}>
        {/* Sport badge */}
        <span
          className="shrink-0 flex items-center justify-center font-mono font-semibold border"
          style={{ width: 42, height: 42, backgroundColor: `${color}22`, borderColor: color, color, fontSize: 17 }}
        >
          {glyph}
        </span>
        {/* Title + badges + date */}
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif text-[20px] font-normal tracking-[-0.02em] leading-[1.15] text-atlas-ink">
              {getActivityTitle(activity)}
            </h2>
            <IntensityBadge type={activity.intensity_type} />
            {activity.is_manual && (
              <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 text-atlas-muted bg-atlas-panel border border-atlas-rule">
                manual
              </span>
            )}
          </div>
          <p className="mt-1.5 font-serif italic text-[13px] text-atlas-muted leading-none">
            {formatDate(activity.start_date)}
          </p>
        </div>
        {/* × close */}
        <button
          onClick={onClose}
          className="absolute top-[14px] right-[14px] w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 overflow-auto" style={{ padding: '16px 22px 18px', maxHeight: 548 }}>
        {/* Hidden banner */}
        {hidden && (
          <div className="flex items-center gap-2 border border-atlas-rule px-3 py-2 text-atlas-muted">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase">Hidden — not counted in statistics</span>
          </div>
        )}

        {/* Skiing subtype */}
        {isSkiing && (
          <div>
            <SectionLabel>Style</SectionLabel>
            <SportTagSelector
              activityId={activity.id}
              currentTag={customTag}
              sportType={activity.sport_type}
              overriddenSportType={activity.overridden_sport_type}
              onChanged={(tag) => setCustomTag(tag)}
            />
          </div>
        )}

        {/* Strength subtype */}
        {isStrength && (
          <div>
            <SectionLabel>Style</SectionLabel>
            <StrengthSubtypeSelector
              activityId={activity.id}
              currentTag={customTag}
              sportType={activity.sport_type}
              onChanged={(tag) => setCustomTag(tag)}
            />
          </div>
        )}

        {/* Intensity */}
        {!isStrength && (
          <div>
            <SectionLabel>Intensity</SectionLabel>
            <IntensityEditor
              activityId={activity.id}
              initialValue={activity.intensity_type}
              onChanged={(val) => { if (val === 'interval') setShowIntervalModal(true) }}
            />
          </div>
        )}

        {/* Stats */}
        <div className="atlas-stat-block border border-atlas-rule grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', padding: '12px 14px' }}>
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted">Duration</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-serif text-[22px] font-normal tracking-[-0.02em] leading-none text-atlas-ink">
                {formatDuration(effectiveDuration(activity))}
              </span>
              {activity.contribution_hours != null && (
                <span className="atlas-badge-competition border font-mono text-[9px] px-1 py-0.5">
                  {activity.contribution_hours}h
                </span>
              )}
            </div>
          </div>
          {activity.distance > 0 && (
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted">Distance</p>
              <span className="font-serif text-[22px] font-normal tracking-[-0.02em] leading-none text-atlas-ink mt-1 block">
                {(activity.distance / 1000).toFixed(2)} km
              </span>
            </div>
          )}
          {activity.average_hr && (
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-muted">Avg HR</p>
              <span className="font-serif text-[22px] font-normal tracking-[-0.02em] leading-none text-atlas-ink mt-1 block">
                {Math.round(activity.average_hr)} bpm
              </span>
            </div>
          )}
        </div>

        {/* Feeling */}
        {showFeeling && (
          <FeelingInput activityId={activity.id} initialValue={activity.rpe} />
        )}

        {/* Notes */}
        <div>
          <SectionLabel>Notes</SectionLabel>
          {editingNote ? (
            <div>
              <textarea
                autoFocus
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onBlur={handleNoteBlur}
                rows={3}
                placeholder="Add a note…"
                className="w-full font-serif italic text-sm text-atlas-ink bg-transparent border border-atlas-rule px-3 py-2 resize-none focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint"
              />
              {savingNote && <p className="font-mono text-[9px] text-atlas-faint mt-1">Saving…</p>}
            </div>
          ) : (
            <button
              onClick={() => setEditingNote(true)}
              className="w-full text-left border border-dashed border-atlas-rule hover:border-atlas-faint transition-colors"
              style={{ padding: '10px 12px', minHeight: 56 }}
            >
              {noteValue
                ? <p className="font-serif italic text-sm text-atlas-ink">{noteValue}</p>
                : <p className="font-serif italic text-[13px] text-atlas-faint">+ Add a note</p>
              }
            </button>
          )}
        </div>

        {/* Coach comment */}
        {isCoach ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Coach comment</SectionLabel>
              {heartActive && (
                <span className="text-sm text-atlas-accent" title="Athlete liked this">
                  ♥{activity.athlete_heart_unread && <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-top mt-0.5" />}
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
                  className="w-full font-serif italic text-sm text-atlas-ink bg-transparent border border-atlas-rule px-3 py-2 resize-none focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint"
                />
                <div className="flex gap-3 mt-1.5">
                  <button
                    onClick={handleSaveComment}
                    disabled={savingComment}
                    className="bg-atlas-selected text-atlas-selectedFg font-mono text-[10px] tracking-[0.1em] uppercase px-4 py-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {savingComment ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingComment(false); setCommentValue(activity.coach_comment ?? '') }}
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
        ) : activity.coach_comment ? (
          <div>
            <SectionLabel>Coach</SectionLabel>
            <div className="atlas-coach-card border border-atlas-rule border-l-2 border-l-atlas-accent flex items-start gap-3" style={{ padding: '12px 14px' }}>
              <div className="flex-1">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-atlas-accent mb-1">Coach</p>
                <p className="font-serif text-sm leading-[1.55] text-atlas-ink">{activity.coach_comment}</p>
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

        {/* Lactate */}
        {showLactate && (
          lactate !== null
            ? <LactateInput activityId={activity.id} initialValues={lactate} />
            : <p className="font-mono text-[9px] text-atlas-faint">Loading lactate…</p>
        )}

        {showIntervalModal && (
          <IntervalSetupModal activityId={activity.id} onClose={() => setShowIntervalModal(false)} />
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-t border-atlas-rule bg-atlas-bg" style={{ padding: '12px 22px 16px' }}>
        <button
          onClick={handleToggleHidden}
          disabled={savingHidden}
          className="font-mono text-[10px] tracking-[0.15em] uppercase text-atlas-muted hover:text-atlas-ink transition-colors disabled:opacity-40"
        >
          {hidden ? '↑ Unhide' : '↯ Hide'}
        </button>
        <div className="flex-1" />
        <button
          onClick={onExpand}
          className="bg-atlas-selected text-atlas-selectedFg font-mono text-[11px] tracking-[0.12em] uppercase hover:opacity-90 transition-opacity"
          style={{ padding: '10px 18px' }}
        >
          Open full view →
        </button>
      </div>
    </Modal>
  )
}
