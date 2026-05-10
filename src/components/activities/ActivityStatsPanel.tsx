import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP } from '@/lib/constants'
import { effectiveSportKey } from '@/lib/activity'
import { DurationEditor } from './DurationEditor'
import { SportTypeEditor } from './SportTypeEditor'
import { IntensityEditor } from './IntensityEditor'

interface ActivityStatsPanelProps {
  activity: Activity
}

function formatDistance(meters: number): string {
  if (meters === 0) return '—'
  return `${(meters / 1000).toFixed(2)} km`
}

function formatSpeed(activity: Activity): string {
  if (!activity.average_speed || activity.average_speed <= 0) return '—'
  const sport = SPORT_TYPE_MAP[activity.sport_type] ?? 'Other'
  if (sport === 'Running') {
    const secsPerKm = 1000 / activity.average_speed
    const m = Math.floor(secsPerKm / 60)
    const s = Math.round(secsPerKm % 60)
    return `${m}:${String(s).padStart(2, '0')} /km`
  }
  return `${(activity.average_speed * 3.6).toFixed(1)} km/h`
}

function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

interface Stat { label: string; value: string }

export function ActivityStatsPanel({ activity }: ActivityStatsPanelProps) {
  const sportKey = effectiveSportKey(activity)
  const isStrength = sportKey === 'Strength' || sportKey === 'strength_basic'

  const stats: Stat[] = [
    { label: 'Date', value: formatDateFull(activity.start_date) },
    { label: 'Distance', value: formatDistance(activity.distance) },
    { label: 'Elevation gain', value: activity.total_elevation_gain ? `${Math.round(activity.total_elevation_gain)} m` : '—' },
    { label: 'Average HR', value: activity.average_hr ? `${Math.round(activity.average_hr)} bpm` : '—' },
    { label: 'Max HR', value: activity.max_hr ? `${Math.round(activity.max_hr)} bpm` : '—' },
    { label: 'Speed', value: formatSpeed(activity) },
  ]

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
      {/* Duration — interactive editor */}
      <DurationEditor
        activityId={activity.id}
        initialOverride={activity.overridden_duration ?? null}
        originalDuration={activity.moving_time ?? activity.elapsed_time}
      />

      {/* Sport — interactive editor */}
      <SportTypeEditor
        activityId={activity.id}
        initialOverride={activity.overridden_sport_type ?? null}
        originalSportType={SPORT_TYPE_MAP[activity.sport_type] ?? activity.sport_type}
        customTag={activity.custom_sport_tag}
      />

      {/* Intensity — interactive editor (hidden for strength activities) */}
      {!isStrength && (
        <IntensityEditor
          activityId={activity.id}
          initialValue={activity.intensity_type}
        />
      )}

      {stats.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-gray-400">{label}</dt>
          <dd className="text-sm text-gray-900 font-medium mt-0.5">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
