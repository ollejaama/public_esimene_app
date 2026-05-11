'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ActivityContent } from './ActivityContent'
import { SportTagSelector } from './SportTagSelector'
import { StrengthSubtypeSelector } from './StrengthSubtypeSelector'
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
  const router = useRouter()
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingHidden, setSavingHidden] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!activityId) {
      setDetail(null)
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

  async function handleToggleHidden() {
    if (!detail) return
    setSavingHidden(true)
    const newHidden = !detail.activity.hidden
    await fetch(`/api/activity/${activityId}/hidden`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: newHidden }),
    })
    setDetail((prev) => prev ? { ...prev, activity: { ...prev.activity, hidden: newHidden } } : prev)
    setSavingHidden(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/activity/${activityId}`, { method: 'DELETE' })
    onClose()
    router.refresh()
  }

  function handleTagChanged(tag: string | null) {
    setDetail((prev) =>
      prev ? { ...prev, activity: { ...prev.activity, custom_sport_tag: tag } } : prev
    )
    router.refresh()
  }

  const activitySeconds = detail
    ? (detail.activity.moving_time ?? detail.activity.elapsed_time)
    : 0

  return (
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
              <div className="flex items-center gap-3 flex-shrink-0 ml-3 mt-0.5">
                {!isCoach && (
                  <>
                    <button
                      onClick={handleToggleHidden}
                      disabled={savingHidden}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      {detail.activity.hidden ? (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Unhide
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                          Hide
                        </>
                      )}
                    </button>
                    {!confirmingDelete ? (
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    ) : (
                      <span className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmingDelete(false)}
                          disabled={deleting}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                        >
                          {deleting ? '…' : 'Confirm delete'}
                        </button>
                      </span>
                    )}
                  </>
                )}
                <Link
                  href={`/activities/${activityId}?from=activities&expanded=true`}
                  className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
                >
                  ↗ expanded view
                </Link>
              </div>
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
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
