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
import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow } from '@/lib/analytics/hrZones'
import { SPORT_COLORS, CUSTOM_TAG_COLOR_KEY } from '@/lib/constants'
import { effectiveSportKey, getActivityTitle } from '@/lib/activity'

interface ActivityExpandedModalProps {
  activityId: string
  onClose: () => void
  isCoach?: boolean
}

interface ActivityDetail {
  activity: Activity
  zoneRows: ZoneRow[]
  latlng: [number, number][] | null
  elevation: number[] | null
  hrData: number[] | null
  laps: ActivityLap[]
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

export function ActivityExpandedModal({ activityId, onClose, isCoach = false }: ActivityExpandedModalProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/activity/${activityId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load activity.')
        setLoading(false)
      })
  }, [activityId])

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
                  {activity.intensity_type === 'interval' && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-600 leading-none flex-shrink-0">INT</span>
                  )}
                  {activity.intensity_type === 'speed' && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-600 leading-none flex-shrink-0">SPD</span>
                  )}
                  {activity.intensity_type === 'competition' && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none flex-shrink-0">★ COMP</span>
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

            <ActivityContent
              activity={activity}
              zoneRows={detail.zoneRows}
              latlng={detail.latlng ?? []}
              hrData={detail.hrData}
              laps={detail.laps}
              activitySeconds={activitySeconds}
              showHRChart={true}
              elevationData={detail.elevation}
              showDangerControls={false}
            />

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
