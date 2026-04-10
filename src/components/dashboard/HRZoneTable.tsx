import { ZoneRow, formatDurationFull } from '@/lib/analytics/hrZones'

interface HRZoneTableProps {
  zones: ZoneRow[]
}

export function HRZoneTable({ zones }: HRZoneTableProps) {
  const totalSeconds = zones.reduce((sum, z) => sum + z.seconds, 0)

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">HR Zones</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-400 border-b border-[#f0f0f0]">
            <th className="text-left pb-2 font-normal w-6"></th>
            <th className="text-left pb-2 font-normal">Zone</th>
            <th className="text-right pb-2 font-normal">Time</th>
            <th className="text-right pb-2 font-normal w-10">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f9f9f9]">
          {zones.map((zone) => (
            <tr key={zone.name} className="group">
              <td className="py-1.5 pr-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: zone.color }}
                />
              </td>
              <td className="py-1.5 pr-4 text-gray-700">{zone.name}</td>
              <td className="py-1.5 text-right text-gray-900 font-mono text-xs tabular-nums">
                {formatDurationFull(zone.seconds)}
              </td>
              <td className="py-1.5 text-right text-gray-400 text-xs w-10 pl-3">
                {zone.percent}%
              </td>
            </tr>
          ))}
          <tr className="border-t border-[#e5e5e5]">
            <td colSpan={2} className="pt-2 pb-1 text-xs text-gray-500 font-medium">Total</td>
            <td className="pt-2 pb-1 text-right text-xs font-mono font-medium text-gray-900 tabular-nums">
              {formatDurationFull(totalSeconds)}
            </td>
            <td className="pt-2 pb-1 text-right text-xs text-gray-400">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
