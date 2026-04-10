'use client'

import { useState } from 'react'
import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow } from '@/lib/analytics/hrZones'
import { ActivityContent } from './ActivityContent'
import { SportTagSelector } from './SportTagSelector'

interface ActivityDetailClientProps {
  activity: Activity
  zoneRows: ZoneRow[]
  latlng: [number, number][]
  hrData: number[] | null
  laps: ActivityLap[]
}

export function ActivityDetailClient({ activity, zoneRows, latlng, hrData, laps }: ActivityDetailClientProps) {
  const [expanded, setExpanded] = useState(false)
  const activitySeconds = activity.moving_time ?? activity.elapsed_time

  return (
    <div className={expanded ? 'space-y-6' : 'max-w-2xl space-y-6'}>
      <div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-left group"
          title={expanded ? 'Collapse view' : 'Expand view'}
        >
          <h1 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-600 transition-colors cursor-pointer">
            {activity.name}
            <span className="ml-2 text-xs font-normal text-gray-300 group-hover:text-gray-400">
              {expanded ? '↙ collapse' : '↗ expand'}
            </span>
          </h1>
        </button>
        <SportTagSelector activityId={activity.id} currentTag={activity.custom_sport_tag} sportType={activity.sport_type} />
      </div>

      <ActivityContent
        activity={activity}
        zoneRows={zoneRows}
        latlng={latlng}
        hrData={hrData}
        laps={laps}
        activitySeconds={activitySeconds}
        showHRChart={expanded}
      />
    </div>
  )
}
