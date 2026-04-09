'use client'

import { useState } from 'react'
import { HRZoneSettings } from '@/lib/supabase/types'
import { HR_ZONE_COLORS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'

interface HRZoneFormProps {
  initialZones: Omit<HRZoneSettings, 'id' | 'user_id' | 'updated_at'>
}

export function HRZoneForm({ initialZones }: HRZoneFormProps) {
  const [zones, setZones] = useState(initialZones)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zoneFields = [
    { index: 1, maxKey: 'zone1_max', nameKey: 'zone1_name', color: HR_ZONE_COLORS[0], label: 'Zone 1', range: (z: typeof zones) => `0 — ${z.zone1_max} bpm` },
    { index: 2, maxKey: 'zone2_max', nameKey: 'zone2_name', color: HR_ZONE_COLORS[1], label: 'Zone 2', range: (z: typeof zones) => `${z.zone1_max + 1} — ${z.zone2_max} bpm` },
    { index: 3, maxKey: 'zone3_max', nameKey: 'zone3_name', color: HR_ZONE_COLORS[2], label: 'Zone 3', range: (z: typeof zones) => `${z.zone2_max + 1} — ${z.zone3_max} bpm` },
    { index: 4, maxKey: 'zone4_max', nameKey: 'zone4_name', color: HR_ZONE_COLORS[3], label: 'Zone 4', range: (z: typeof zones) => `${z.zone3_max + 1} — ${z.zone4_max} bpm` },
    { index: 5, maxKey: null, nameKey: 'zone5_name', color: HR_ZONE_COLORS[4], label: 'Zone 5', range: (z: typeof zones) => `${z.zone4_max + 1}+ bpm` },
  ] as const

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/settings/hr-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zones),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Failed to save zone settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-[#f0f0f0]">
            <th className="pb-2 font-medium w-4"></th>
            <th className="pb-2 font-medium">Zone</th>
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Max BPM</th>
            <th className="pb-2 font-medium">Range</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {zoneFields.map((z) => (
            <tr key={z.index}>
              <td className="py-2 pr-3">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: z.color }}
                />
              </td>
              <td className="py-2 pr-4 text-gray-600">{z.label}</td>
              <td className="py-2 pr-4">
                <input
                  type="text"
                  value={zones[z.nameKey as keyof typeof zones] as string}
                  onChange={(e) => setZones((prev) => ({ ...prev, [z.nameKey]: e.target.value }))}
                  className="w-20 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </td>
              <td className="py-2 pr-4">
                {z.maxKey ? (
                  <input
                    type="number"
                    value={zones[z.maxKey as keyof typeof zones] as number}
                    onChange={(e) =>
                      setZones((prev) => ({ ...prev, [z.maxKey!]: parseInt(e.target.value) || 0 }))
                    }
                    className="w-20 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    min={0}
                    max={250}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">no limit</span>
                )}
              </td>
              <td className="py-2 text-gray-500 text-xs">{z.range(zones)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save zones'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
