'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ZoneRow, formatDuration } from '@/lib/analytics/hrZones'

interface HRZoneDonutChartProps {
  zones: ZoneRow[]
}

export function HRZoneDonutChart({ zones }: HRZoneDonutChartProps) {
  const data = zones.filter((z) => z.seconds > 0)
  const totalSeconds = zones.reduce((sum, z) => sum + z.seconds, 0)

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No HR data</div>
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="seconds"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((zone) => (
              <Cell key={zone.name} fill={zone.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatDuration(Number(value)), '']}
            contentStyle={{ fontSize: 12, border: '1px solid #e5e5e5', borderRadius: 6 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5">
        {zones.map((zone) => (
          <div key={zone.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: zone.color }} />
            <span className="text-gray-600 w-8">{zone.name}</span>
            <span className="font-mono text-xs text-gray-900 tabular-nums">{formatDuration(zone.seconds)}</span>
            <span className="text-xs text-gray-400">{zone.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
