import { Activity } from '@/lib/supabase/types'
import { SPORT_TYPE_MAP, SPORT_COLORS, CUSTOM_SPORT_TAG_LABELS, CustomSportTag } from '@/lib/constants'
import { formatDuration } from '@/lib/analytics/hrZones'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface ActivityBreakdownTableProps {
  activities: Activity[]
}

function getSportLabel(activity: Activity): string {
  if (activity.custom_sport_tag) {
    return CUSTOM_SPORT_TAG_LABELS[activity.custom_sport_tag as CustomSportTag] ?? activity.custom_sport_tag
  }
  return SPORT_TYPE_MAP[activity.sport_type] ?? activity.sport_type
}

function getSportColor(activity: Activity): string {
  const key = activity.custom_sport_tag
    ? (activity.custom_sport_tag.includes('ski') ? 'Skiing' : activity.custom_sport_tag.includes('rollerski') ? 'Rollerski' : 'Other')
    : (SPORT_TYPE_MAP[activity.sport_type] ?? 'Other')
  return SPORT_COLORS[key] ?? SPORT_COLORS.Other
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(isoDate))
}

function formatPace(activity: Activity): string {
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

export function ActivityBreakdownTable({ activities }: ActivityBreakdownTableProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-400">No activities this week.</p>
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Activities</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-[#f0f0f0]">
            <th className="text-left pb-2 font-normal">Date</th>
            <th className="text-left pb-2 font-normal">Activity</th>
            <th className="text-left pb-2 font-normal">Sport</th>
            <th className="text-right pb-2 font-normal">Duration</th>
            <th className="text-right pb-2 font-normal">Pace</th>
            <th className="text-right pb-2 font-normal">Avg HR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f9f9f9]">
          {activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-gray-50">
              <td className="py-2 pr-4 text-gray-500 text-xs whitespace-nowrap">
                {formatDate(activity.start_date)}
              </td>
              <td className="py-2 pr-4">
                <Link
                  href={`/activities/${activity.id}`}
                  className="text-gray-900 hover:underline"
                >
                  {activity.name}
                </Link>
              </td>
              <td className="py-2 pr-4">
                <Badge label={getSportLabel(activity)} color={getSportColor(activity)} />
              </td>
              <td className="py-2 text-right font-mono text-xs tabular-nums">
                {formatDuration(activity.elapsed_time)}
              </td>
              <td className="py-2 text-right text-xs text-gray-500 pl-4">
                {formatPace(activity)}
              </td>
              <td className="py-2 text-right text-xs text-gray-500 pl-4">
                {activity.average_hr ? `${Math.round(activity.average_hr)} bpm` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
