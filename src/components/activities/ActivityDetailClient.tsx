'use client'

import { useState } from 'react'
import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow } from '@/lib/analytics/hrZones'
import { getActivityTitle, effectiveDuration } from '@/lib/activity'
import { ActivityContent } from './ActivityContent'
import { SportTagSelector } from './SportTagSelector'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'
import { NotesEditor } from './NotesEditor'
import { ContributionEditor } from './ContributionEditor'
import { HideToggle } from './HideToggle'

interface ActivityDetailClientProps {
  activity: Activity
  zoneRows: ZoneRow[]
  latlng: [number, number][]
  hrData: number[] | null
  laps: ActivityLap[]
  elevationData: number[] | null
  defaultExpanded?: boolean
}

export function ActivityDetailClient({ activity, zoneRows, latlng, hrData, laps, elevationData, defaultExpanded }: ActivityDetailClientProps) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const activitySeconds = effectiveDuration(activity)

  return (
    <div className={expanded ? 'space-y-6' : 'max-w-2xl space-y-6'}>
      <div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-left group"
          title={expanded ? 'Collapse view' : 'Expand view'}
        >
          <h1 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-gray-600 transition-colors cursor-pointer">
            {getActivityTitle(activity)}
            <span className="ml-2 text-xs font-normal text-gray-300 group-hover:text-gray-400">
              {expanded ? '↙ collapse' : '↗ expand'}
            </span>
          </h1>
        </button>
        <SportTagSelector activityId={activity.id} currentTag={activity.custom_sport_tag} sportType={activity.sport_type} />
        <StrengthSubtypeSelector activityId={activity.id} currentTag={activity.custom_sport_tag} sportType={activity.sport_type} />
        <NotesEditor activityId={activity.id} initialNotes={activity.notes} />
      </div>

      <ActivityContent
        activity={activity}
        zoneRows={zoneRows}
        latlng={latlng}
        hrData={hrData}
        laps={laps}
        activitySeconds={activitySeconds}
        showHRChart={expanded}
        elevationData={elevationData}
        showDangerControls={false}
      />
      <div className="border-t border-[#e5e5e5] pt-6 space-y-3">
        <ContributionEditor
          activityId={activity.id}
          initialHours={activity.contribution_hours ?? null}
        />
        <HideToggle
          activityId={activity.id}
          initialHidden={activity.hidden}
        />
      </div>
    </div>
  )
}
