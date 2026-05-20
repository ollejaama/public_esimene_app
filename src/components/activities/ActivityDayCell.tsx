'use client'

import { useState } from 'react'
import { Activity, IllnessLog } from '@/lib/supabase/types'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveContributionSeconds, effectiveSportKey } from '@/lib/activity'

const ILLNESS_COLORS: Record<string, string> = {
  sick: '#ef4444',
  injured: '#fb923c',
  fatigue: '#facc15',
}

const SPORT_GLYPHS: Record<string, string> = {
  ski_classic: '╱╱', ski_skate: '╳╳',
  rollerski_classic: '╱·', rollerski_skate: '╳·',
  run: '↗', strength: '◼', basic_strength: '◻',
  cycling: '◯', treadmill: '═', imitation: '·',
  Running: '↗', Skiing: '╱╱', Rollerski: '╱·',
  Strength: '◼', Cycling: '◯', Treadmill: '═', Imitation: '·',
}

const SPORT_SHORT: Record<string, string> = {
  ski_classic: 'Classic', ski_skate: 'Skate',
  rollerski_classic: 'Rollerski', rollerski_skate: 'Rollerski',
  run: 'Run', strength: 'Strength', basic_strength: 'Strength',
  cycling: 'Cycling', treadmill: 'Treadmill', imitation: 'Imitation',
}

function getSportColor(activity: Activity): string {
  const key = effectiveSportKey(activity)
  return SPORT_COLORS[CUSTOM_TAG_COLOR_KEY[key] ?? key] ?? SPORT_COLORS.Other
}

function getSportGlyph(activity: Activity): string {
  return SPORT_GLYPHS[activity.custom_sport_tag ?? '']
    ?? SPORT_GLYPHS[effectiveSportKey(activity)]
    ?? '·'
}

function getSportShort(activity: Activity): string {
  if (activity.custom_sport_tag && SPORT_SHORT[activity.custom_sport_tag]) return SPORT_SHORT[activity.custom_sport_tag]
  return effectiveSportKey(activity)
}

function fmtMins(seconds: number): string {
  const m = Math.round(seconds / 60)
  const h = Math.floor(m / 60), mm = m % 60
  if (h && mm) return `${h}h${String(mm).padStart(2, '0')}`
  if (h) return `${h}h`
  return `${mm}m`
}

interface ActivityDayCellProps {
  date: Date
  activities: Activity[]
  isCurrentMonth: boolean
  onActivityClick: (activity: Activity) => void
  onDayClick?: () => void
  restDayThresholdMinutes?: number
  illnessEntries?: IllnessLog[]
}

export function ActivityDayCell({
  date, activities, isCurrentMonth, onActivityClick, onDayClick,
  restDayThresholdMinutes = 0, illnessEntries = [],
}: ActivityDayCellProps) {
  const isToday = new Date().toDateString() === date.toDateString()
  const [expanded, setExpanded] = useState(false)

  const visibleActivities = expanded ? activities : activities.slice(0, 3)
  const overflowCount = activities.length - 3

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const isPastOrToday = date <= today
  const dayTotalSeconds = activities
    .filter((a) => !a.hidden)
    .reduce((sum, a) => sum + effectiveContributionSeconds(a), 0)
  const isRestDay = isCurrentMonth && isPastOrToday && (
    restDayThresholdMinutes === 0 ? dayTotalSeconds === 0 : dayTotalSeconds < restDayThresholdMinutes * 60
  )

  const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const dayIllness = illnessEntries.filter((e) => e.start_date <= dayKey && e.end_date >= dayKey)
  const illnessColors = Array.from(new Set(dayIllness.map((e) => ILLNESS_COLORS[e.category]).filter(Boolean))) as string[]

  const totalMins = Math.round(dayTotalSeconds / 60)

  return (
    <div
      className={`min-h-[102px] border-b border-r border-atlas-rule cursor-pointer relative transition-colors hover:bg-[rgba(255,255,255,0.04)] ${
        !isCurrentMonth ? 'opacity-[0.35]' : ''
      } ${isToday ? 'atlas-today-bg' : ''}`}
      style={{ padding: '8px 10px' }}
      onClick={() => onDayClick?.()}
    >
      {/* Date numeral + total minutes */}
      <div className="flex items-baseline justify-between mb-1">
        <span className={`font-serif text-[18px] leading-none tracking-[-0.02em] text-atlas-ink ${isToday ? 'italic' : ''}`}>
          {date.getDate()}
        </span>
        {totalMins > 0 && (
          <span className="font-mono text-[9px] tracking-[0.1em] text-atlas-faint">
            {totalMins}m
          </span>
        )}
      </div>

      {/* Illness dots */}
      {illnessColors.length > 0 && (
        <div className="flex gap-0.5 mb-1">
          {illnessColors.map((color, i) => (
            <span key={i} className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      {/* Activity pills */}
      <div className="flex flex-col gap-[3px]">
        {visibleActivities.map((activity) => {
          const isInterval = activity.intensity_type === 'interval'
          const isComp = activity.intensity_type === 'competition'
          const color = getSportColor(activity)
          const glyph = getSportGlyph(activity)
          const shortName = getSportShort(activity)
          const dur = fmtMins(effectiveContributionSeconds(activity))

          return (
            <button
              key={activity.id}
              onClick={(e) => { e.stopPropagation(); onActivityClick(activity) }}
              className={`w-full text-left ${activity.hidden ? 'opacity-40 grayscale' : ''}`}
            >
              <span
                className={`flex items-center border-l-2 leading-[1.2] hover:opacity-80 transition-opacity ${
                  isComp
                    ? 'atlas-pill-competition border-[#b8860b]'
                    : isInterval
                    ? 'atlas-pill-interval border-atlas-accent'
                    : ''
                }`}
                style={{
                  padding: '3px 6px 4px',
                  ...((!isComp && !isInterval) ? {
                    backgroundColor: `${color}20`,
                    borderLeftColor: color,
                  } : {}),
                }}
              >
                {/* Sport glyph */}
                <span
                  className="font-mono text-[9px] shrink-0 mr-1"
                  style={{ color: isComp ? '#b8860b' : isInterval ? 'var(--atlas-faint)' : `${color}99` }}
                >
                  {isComp ? '★' : glyph}
                </span>

                {/* Sport name */}
                <span
                  className="font-serif italic text-[12px] truncate"
                  style={{ color: isComp ? '#b8860b' : isInterval ? 'var(--atlas-accent)' : color }}
                >
                  {isComp ? 'Race' : shortName}
                </span>

                {/* Indicators */}
                {activity.hidden && (
                  <svg className="w-2.5 h-2.5 shrink-0 opacity-60 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
                {activity.is_manual && !activity.hidden && (
                  <svg className="w-2 h-2 shrink-0 opacity-40 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )}
                {activity.contribution_hours != null && !activity.hidden && (
                  <span className="font-mono text-[8px] font-bold px-0.5 bg-amber-50 text-amber-600 shrink-0 leading-none ml-0.5">P</span>
                )}
                {activity.coach_comment && !activity.hidden && (
                  <span className="relative shrink-0 ml-0.5">
                    <svg className="w-2 h-2 opacity-50" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {activity.coach_comment_unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-red-500" />
                    )}
                  </span>
                )}

                {/* Duration */}
                <span
                  className="font-mono text-[9px] ml-auto shrink-0 pl-1"
                  style={{ color: isComp ? '#b8860b' : isInterval ? 'var(--atlas-muted)' : `${color}cc` }}
                >
                  {dur}
                </span>
              </span>
            </button>
          )
        })}

        {!expanded && overflowCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
            className="font-mono text-[9px] text-atlas-faint hover:text-atlas-muted px-1 transition-colors text-left"
          >
            +{overflowCount} more
          </button>
        )}
        {expanded && overflowCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            className="font-mono text-[9px] text-atlas-faint hover:text-atlas-muted px-1 transition-colors text-left"
          >
            show less
          </button>
        )}
      </div>

      {/* Rest italic note — only when truly empty */}
      {isRestDay && activities.length === 0 && (
        <span className="absolute bottom-2 left-[10px] font-serif italic text-[10px] text-atlas-faint">
          rest
        </span>
      )}
    </div>
  )
}
