'use client'

import { usePlanWatcher } from '@/hooks/usePlanWatcher'

export function PlanRefresher() {
  usePlanWatcher()
  return null
}
