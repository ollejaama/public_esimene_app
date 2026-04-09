'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ActivityStatsPanel } from './ActivityStatsPanel'
import { HRZoneTableActivity } from './HRZoneTableActivity'
import { GPSMap } from './GPSMap'
import { Activity } from '@/lib/supabase/types'
import { ZoneRow } from '@/lib/analytics/hrZones'

interface ActivityModalProps {
  activityId: string | null
  onClose: () => void
}

interface ActivityDetail {
  activity: Activity
  zoneRows: ZoneRow[]
  latlng: [number, number][] | null
}

export function ActivityModal({ activityId, onClose }: ActivityModalProps) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-gray-900 pr-8">
              {detail.activity.name}
            </h2>

            <ActivityStatsPanel activity={detail.activity} />

            {detail.zoneRows.some((z) => z.seconds > 0) && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  HR Zones
                </h3>
                <HRZoneTableActivity zones={detail.zoneRows} />
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Route
              </h3>
              <GPSMap latlng={detail.latlng ?? []} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
