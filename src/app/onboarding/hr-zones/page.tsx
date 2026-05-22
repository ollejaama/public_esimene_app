import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { HRZoneForm } from '@/components/settings/HRZoneForm'
import { OnboardingContinue } from './OnboardingContinue'

export const metadata = { title: 'HR Zones — Atlas' }

const DEFAULT_ZONES = {
  zone1_max: 130,
  zone2_max: 148,
  zone3_max: 162,
  zone4_max: 174,
  zone1_name: 'I1',
  zone2_name: 'I2',
  zone3_name: 'I3',
  zone4_name: 'I4',
  zone5_name: 'I5',
  rest_day_threshold_minutes: 0,
}

export default async function OnboardingHRZonesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = createServiceClient()
  const { data: zoneData } = await db
    .from('hr_zone_settings')
    .select('*')
    .eq('user_id', session.userId)
    .maybeSingle()

  const zones = zoneData
    ? {
        zone1_max: zoneData.zone1_max,
        zone2_max: zoneData.zone2_max,
        zone3_max: zoneData.zone3_max,
        zone4_max: zoneData.zone4_max,
        zone1_name: zoneData.zone1_name,
        zone2_name: zoneData.zone2_name,
        zone3_name: zoneData.zone3_name,
        zone4_name: zoneData.zone4_name,
        zone5_name: zoneData.zone5_name,
        rest_day_threshold_minutes: zoneData.rest_day_threshold_minutes ?? 0,
      }
    : DEFAULT_ZONES

  return (
    <div className="w-full max-w-xl">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas · Step 3 of 3
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        Set your HR zones
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        These zones are used to categorise your training intensity.
        You can update them anytime in Settings.
      </p>

      <div className="border border-atlas-rule p-6 mb-6">
        <HRZoneForm initialZones={zones} />
      </div>

      <OnboardingContinue />
    </div>
  )
}
