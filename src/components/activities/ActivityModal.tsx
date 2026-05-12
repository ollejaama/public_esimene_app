'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ActivityContent } from './ActivityContent'
import { SportTagSelector } from './SportTagSelector'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'
import { ContributionEditor } from './ContributionEditor'
import { HideToggle } from './HideToggle'
import { ActivityExpandedModal } from './ActivityExpandedModal'
import { Activity, ActivityLap } from '@/lib/supabase/types'
import { ZoneRow } from '@/lib/analytics/hrZones'
import { getActivityTitle } from '@/lib/activity'

interface ActivityModalProps {
  activityId: string | null
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

export function ActivityModal({ activityId, onClose, isCoach = false }: ActivityModalProps) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExpanded, setShowExpanded] = useState(false)

  useEffect(() => {
    if (!activityId) {
      setDetail(null)
      setShowExpanded(false)
      return
    }
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
  }

  const activitySeconds = detail
    ? (detail.activity.moving_time ?? detail.activity.elapsed_time)
    : 0

  return (
    <>
      <Modal open={!!activityId} onClose={onClose} maxWidth="max-w-2xl">
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Spinner className="w-6 h-6" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {detail && !loading && (
            <div className="space-y-4">
              <div className="flex items-start justify-between pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-gray-900">
                    {getActivityTitle(detail.activity)}
                  </h2>
                  {detail.activity.hidden && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-200 text-gray-500 leading-none">hidden</span>
                  )}
                  {detail.activity.is_manual && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none">manual</span>
                  )}
                </div>
                <button
                  onClick={() => setShowExpanded(true)}
                  className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 ml-3 mt-0.5"
                >
                  ↗ expanded view
                </button>
              </div>
              <SportTagSelector
                activityId={detail.activity.id}
                currentTag={detail.activity.custom_sport_tag}
                sportType={detail.activity.sport_type}
                onChanged={handleTagChanged}
              />
              <StrengthSubtypeSelector
                activityId={detail.activity.id}
                currentTag={detail.activity.custom_sport_tag}
                sportType={detail.activity.sport_type}
                onChanged={handleTagChanged}
              />
              <ActivityContent
                activity={detail.activity}
                zoneRows={detail.zoneRows}
                latlng={detail.latlng ?? []}
                hrData={detail.hrData}
                laps={detail.laps}
                activitySeconds={activitySeconds}
                showHRChart={true}
                elevationData={detail.elevation}
                showDangerControls={false}
              />
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <ContributionEditor
                  activityId={detail.activity.id}
                  initialHours={detail.activity.contribution_hours ?? null}
                />
                {!isCoach && (
                  <HideToggle
                    activityId={detail.activity.id}
                    initialHidden={detail.activity.hidden}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {showExpanded && activityId && (
        <ActivityExpandedModal
          activityId={activityId}
          onClose={onClose}
          isCoach={isCoach}
        />
      )}
    </>
  )
}
