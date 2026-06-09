'use client'

import { useState } from 'react'
import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'
import { effectiveSportKey } from '@/lib/activity'
import { formatDuration } from '@/lib/analytics/hrZones'
import { IntensityEditor } from './IntensityEditor'
import { ContributionEditor } from './ContributionEditor'
import { HideToggle } from './HideToggle'

const SPORT_TYPE_OPTIONS = [
  { value: 'Running',              label: 'Running' },
  { value: 'Treadmill running',    label: 'Treadmill running' },
  { value: 'crosscountry_classic', label: 'Cross-country classic' },
  { value: 'cr_skate',             label: 'Cross-country skate' },
  { value: 'rollerski_classic',    label: 'Rollerski classic' },
  { value: 'rollerski_skate',      label: 'Rollerski skate' },
  { value: 'treadmill_classic',    label: 'Treadmill classic' },
  { value: 'treadmill_skate',      label: 'Treadmill skate' },
  { value: 'Imitation',            label: 'Imitation' },
  { value: 'Cycling',              label: 'Cycling' },
  { value: 'Strength',             label: 'Strength' },
  { value: 'strength_basic',       label: 'Basic strength' },
  { value: 'Other',                label: 'Other' },
]

function getSportLabel(key: string): string {
  return CUSTOM_SPORT_TAG_LABELS[key as CustomSportTag] ?? key
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(d)
}

function formatYear(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric' }).format(new Date(iso))
}

function formatStartTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

function formatDistance(meters: number): string {
  if (meters <= 0) return '—'
  return `${(meters / 1000).toFixed(2)} km`
}

function formatPace(speedMs: number | null | undefined, unit: 'min_km' | 'km_h'): string {
  if (!speedMs || speedMs <= 0) return '—'
  if (unit === 'min_km') {
    const secsPerKm = 1000 / speedMs
    const m = Math.floor(secsPerKm / 60)
    const s = Math.round(secsPerKm % 60)
    return `${m}:${String(s).padStart(2, '0')} /km`
  }
  return `${(speedMs * 3.6).toFixed(1)} km/h`
}

const EditIcon = () => (
  <svg className="w-3 h-3 flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
)

interface CellProps {
  label: string
  isLastCol: boolean
  isLastRow: boolean
  children: React.ReactNode
}

function Cell({ label, isLastCol, isLastRow, children }: CellProps) {
  return (
    <div
      className={[
        'p-4 min-w-0',
        !isLastCol ? 'border-r border-atlas-rule' : '',
        !isLastRow ? 'border-b border-atlas-rule' : '',
      ].join(' ')}
    >
      <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-atlas-muted mb-2">{label}</p>
      {children}
    </div>
  )
}

const inputCls = 'w-10 border border-atlas-rule bg-transparent font-mono text-[12px] text-atlas-ink text-center px-1 py-0.5 focus:outline-none'
const btnSave = 'font-mono text-[9px] bg-atlas-ink text-atlas-bg px-2.5 py-1 hover:opacity-80 transition-opacity disabled:opacity-40'
const btnCancel = 'font-mono text-[9px] text-atlas-muted hover:text-atlas-ink transition-colors'

interface ActivityStatsGridProps {
  activity: Activity
  showDangerControls?: boolean
  onIntensityChange?: (val: string) => void
  onSportTypeChanged?: (val: string | null) => void
}

export function ActivityStatsGrid({ activity, showDangerControls = true, onIntensityChange, onSportTypeChanged }: ActivityStatsGridProps) {
  const sportKey = effectiveSportKey(activity)
  const isStrength = sportKey === 'Strength' || sportKey === 'strength_basic'
  const isCycling = (SPORT_TYPE_MAP[activity.sport_type] ?? 'Other') === 'Cycling'

  // Duration
  const [durOverride, setDurOverride] = useState<number | null>(activity.overridden_duration ?? null)
  const [durEditing, setDurEditing] = useState(false)
  const [durSaving, setDurSaving] = useState(false)
  const [durError, setDurError] = useState<string | null>(null)
  const effectiveDur = durOverride ?? (activity.moving_time ?? activity.elapsed_time)
  const [dH, setDH] = useState(Math.floor(effectiveDur / 3600))
  const [dM, setDM] = useState(Math.floor((effectiveDur % 3600) / 60))

  function openDurEdit() {
    const e = durOverride ?? (activity.moving_time ?? activity.elapsed_time)
    setDH(Math.floor(e / 3600)); setDM(Math.floor((e % 3600) / 60))
    setDurError(null); setDurEditing(true)
  }

  async function saveDur() {
    const s = dH * 3600 + dM * 60
    if (s <= 0) { setDurError('Must be > 0'); return }
    setDurSaving(true); setDurError(null)
    try {
      const r = await fetch(`/api/activity/${activity.id}/duration`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_duration: s }),
      })
      if (!r.ok) { setDurError('Save failed'); return }
      setDurOverride(s); setDurEditing(false)
    } finally { setDurSaving(false) }
  }

  async function resetDur() {
    setDurSaving(true)
    try {
      const r = await fetch(`/api/activity/${activity.id}/duration`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_duration: null }),
      })
      if (!r.ok) return
      setDurOverride(null); setDurEditing(false)
    } finally { setDurSaving(false) }
  }

  // Sport
  const [sportOverride, setSportOverride] = useState<string | null>(activity.overridden_sport_type ?? null)
  const [sportEditing, setSportEditing] = useState(false)
  const [sportSaving, setSportSaving] = useState(false)
  const [sportError, setSportError] = useState<string | null>(null)
  const [sportSel, setSportSel] = useState(activity.overridden_sport_type ?? '')
  const displaySport = sportOverride
    ? getSportLabel(sportOverride)
    : (SPORT_TYPE_MAP[activity.sport_type] ?? activity.sport_type)

  function openSportEdit() { setSportSel(sportOverride ?? ''); setSportError(null); setSportEditing(true) }

  async function saveSport() {
    setSportSaving(true); setSportError(null)
    try {
      const r = await fetch(`/api/activity/${activity.id}/sport-type`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_sport_type: sportSel || null }),
      })
      if (!r.ok) { setSportError('Save failed'); return }
      setSportOverride(sportSel || null); setSportEditing(false)
      onSportTypeChanged?.(sportSel || null)
    } finally { setSportSaving(false) }
  }

  async function resetSport() {
    setSportSaving(true)
    try {
      const r = await fetch(`/api/activity/${activity.id}/sport-type`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overridden_sport_type: null }),
      })
      if (!r.ok) return
      setSportOverride(null); setSportEditing(false)
      onSportTypeChanged?.(null)
    } finally { setSportSaving(false) }
  }

  // Pace toggle
  const [paceUnit, setPaceUnit] = useState<'min_km' | 'km_h'>(isCycling ? 'km_h' : 'min_km')
  const hasPace = (activity.average_speed ?? 0) > 0

  return (
    <div className="space-y-4">
      {/* 3×3 grid */}
      <div
        className="border border-atlas-rule"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1.5px solid var(--atlas-ink)' }}
      >
        {/* Row 1: Date / Started / Duration */}
        <Cell label="Date" isLastCol={false} isLastRow={false}>
          <p className="font-mono text-[15px] tabular-nums text-atlas-ink leading-none">{formatDate(activity.start_date)}</p>
          <p className="font-mono text-[10px] text-atlas-faint mt-1">{formatYear(activity.start_date)}</p>
        </Cell>

        <Cell label="Started" isLastCol={false} isLastRow={false}>
          <p className="font-mono text-[22px] tabular-nums text-atlas-ink leading-none">{formatStartTime(activity.start_date)}</p>
        </Cell>

        <Cell label="Duration" isLastCol={true} isLastRow={false}>
          {durEditing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} max={23} value={dH}
                  onChange={(e) => setDH(Math.max(0, parseInt(e.target.value) || 0))}
                  className={inputCls} />
                <span className="font-mono text-[9px] text-atlas-faint">h</span>
                <input type="number" min={0} max={59} value={dM}
                  onChange={(e) => setDM(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className={inputCls} />
                <span className="font-mono text-[9px] text-atlas-faint">m</span>
              </div>
              <div className="flex gap-2">
                <button onClick={saveDur} disabled={durSaving} className={btnSave}>{durSaving ? '…' : 'Save'}</button>
                <button onClick={() => setDurEditing(false)} className={btnCancel}>Cancel</button>
              </div>
              {durError && <p className="font-mono text-[9px] text-[#a23b2a]">{durError}</p>}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1">
              <div>
                <p className="font-mono text-[22px] tabular-nums text-atlas-ink leading-none">{formatDuration(effectiveDur)}</p>
                {durOverride !== null && (
                  <button onClick={resetDur} disabled={durSaving} className="font-mono text-[9px] text-atlas-faint hover:text-atlas-muted transition-colors mt-1 block disabled:opacity-40">
                    reset
                  </button>
                )}
              </div>
              <button onClick={openDurEdit} className="mt-0.5 text-atlas-faint hover:text-atlas-muted transition-colors flex-shrink-0" title="Edit duration">
                <EditIcon />
              </button>
            </div>
          )}
        </Cell>

        {/* Row 2: Sport / Distance / Elevation */}
        <Cell label="Sport" isLastCol={false} isLastRow={false}>
          {sportEditing ? (
            <div className="space-y-2">
              <select value={sportSel} onChange={(e) => setSportSel(e.target.value)}
                className="w-full border border-atlas-rule bg-transparent font-mono text-[10px] text-atlas-ink px-1.5 py-1 focus:outline-none">
                <option value="">— original —</option>
                {SPORT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={saveSport} disabled={sportSaving} className={btnSave}>{sportSaving ? '…' : 'Save'}</button>
                <button onClick={() => setSportEditing(false)} className={btnCancel}>Cancel</button>
              </div>
              {sportError && <p className="font-mono text-[9px] text-[#a23b2a]">{sportError}</p>}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1">
              <div>
                <p className="font-mono text-[15px] text-atlas-ink leading-none truncate">{displaySport}</p>
                {sportOverride !== null && (
                  <button onClick={resetSport} disabled={sportSaving} className="font-mono text-[9px] text-atlas-faint hover:text-atlas-muted transition-colors mt-1 block disabled:opacity-40">
                    reset
                  </button>
                )}
              </div>
              <button onClick={openSportEdit} className="mt-0.5 text-atlas-faint hover:text-atlas-muted transition-colors flex-shrink-0" title="Edit sport">
                <EditIcon />
              </button>
            </div>
          )}
        </Cell>

        <Cell label="Distance" isLastCol={false} isLastRow={false}>
          <p className="font-mono text-[22px] tabular-nums text-atlas-ink leading-none">{formatDistance(activity.distance)}</p>
        </Cell>

        <Cell label="Elevation" isLastCol={true} isLastRow={false}>
          {activity.total_elevation_gain ? (
            <>
              <p className="font-mono text-[22px] tabular-nums text-atlas-ink leading-none">{Math.round(activity.total_elevation_gain)}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-1">metres</p>
            </>
          ) : (
            <p className="font-mono text-[22px] tabular-nums text-atlas-faint leading-none">—</p>
          )}
        </Cell>

        {/* Row 3: Avg HR / Max HR / Pace */}
        <Cell label="Avg HR" isLastCol={false} isLastRow={true}>
          {activity.average_hr ? (
            <>
              <p className="font-mono text-[22px] tabular-nums text-atlas-ink leading-none">{Math.round(activity.average_hr)}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-1">bpm</p>
            </>
          ) : (
            <p className="font-mono text-[22px] tabular-nums text-atlas-faint leading-none">—</p>
          )}
        </Cell>

        <Cell label="Max HR" isLastCol={false} isLastRow={true}>
          {activity.max_hr ? (
            <>
              <p className="font-mono text-[22px] tabular-nums text-atlas-ink leading-none">{Math.round(activity.max_hr)}</p>
              <p className="font-mono text-[10px] text-atlas-faint mt-1">bpm</p>
            </>
          ) : (
            <p className="font-mono text-[22px] tabular-nums text-atlas-faint leading-none">—</p>
          )}
        </Cell>

        <Cell label="Pace" isLastCol={true} isLastRow={true}>
          {hasPace ? (
            <button
              onClick={() => setPaceUnit(u => u === 'min_km' ? 'km_h' : 'min_km')}
              className="text-left w-full group"
              title="Toggle unit"
            >
              <p className="font-mono text-[18px] tabular-nums text-atlas-ink leading-none">{formatPace(activity.average_speed, paceUnit)}</p>
              <p className="font-mono text-[9px] text-atlas-faint mt-1 group-hover:text-atlas-muted transition-colors">
                {paceUnit === 'min_km' ? 'tap for km/h' : 'tap for min/km'}
              </p>
            </button>
          ) : (
            <p className="font-mono text-[22px] tabular-nums text-atlas-faint leading-none">—</p>
          )}
        </Cell>
      </div>

      {/* Controls below grid */}
      {!isStrength && (
        <IntensityEditor
          activityId={activity.id}
          initialValue={activity.intensity_type}
          onChanged={onIntensityChange}
        />
      )}

      {showDangerControls && (
        <>
          <ContributionEditor activityId={activity.id} initialHours={activity.contribution_hours ?? null} />
          <HideToggle activityId={activity.id} initialHidden={activity.hidden} />
        </>
      )}
    </div>
  )
}
