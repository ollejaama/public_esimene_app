import { ZoneRow, formatDurationFull } from '@/lib/analytics/hrZones'

interface HRZoneTableActivityProps {
  zones: ZoneRow[]
}

export function HRZoneTableActivity({ zones }: HRZoneTableActivityProps) {
  const totalSeconds = zones.reduce((sum, z) => sum + z.seconds, 0)

  if (totalSeconds === 0) {
    return <p className="text-sm text-gray-400">No HR data for this activity.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-gray-400 border-b border-[#f0f0f0]">
          <th className="text-left pb-2 font-normal w-4"></th>
          <th className="text-left pb-2 font-normal">Zone</th>
          <th className="text-right pb-2 font-normal">Time</th>
          <th className="text-right pb-2 font-normal">Share</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#f9f9f9]">
        {zones.map((zone) => (
          <tr key={zone.name}>
            <td className="py-1.5 pr-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: zone.color }} />
            </td>
            <td className="py-1.5 pr-4 text-gray-700">{zone.name}</td>
            <td className="py-1.5 text-right font-mono text-xs tabular-nums">{formatDurationFull(zone.seconds)}</td>
            <td className="py-1.5 text-right text-xs text-gray-400">{zone.percent}%</td>
          </tr>
        ))}
        <tr className="border-t border-[#e5e5e5]">
          <td colSpan={2} className="pt-2 text-xs font-medium text-gray-500">Total</td>
          <td className="pt-2 text-right text-xs font-mono font-medium text-gray-900 tabular-nums">{formatDurationFull(totalSeconds)}</td>
          <td className="pt-2 text-right text-xs text-gray-400">100%</td>
        </tr>
      </tbody>
    </table>
  )
}
