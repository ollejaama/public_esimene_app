'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { ZoneProgressionPoint } from '@/lib/analytics/zoneProgression'

type TimeRange = 'week' | 'month' | 'season' | 'all'

interface VolumeByZoneChartProps {
  data: ZoneProgressionPoint[]
  zoneNames: Record<string, string>
  range: TimeRange
}

const ZONE_KEYS = ['z0', 'z1', 'z2', 'z3', 'z4', 'z5'] as const
type ZoneKey = typeof ZONE_KEYS[number]

const ZONE_COLORS: Record<ZoneKey, string> = {
  z0: '#94a3b8',
  z1: '#4ade80',
  z2: '#86efac',
  z3: '#facc15',
  z4: '#fb923c',
  z5: '#ef4444',
}

function fmtHours(h: number): string {
  const hrs = Math.floor(h)
  const min = Math.round((h - hrs) * 60)
  if (hrs > 0 && min > 0) return `${hrs}h ${min}m`
  if (hrs > 0) return `${hrs}h`
  return `${min}m`
}

interface ChartPoint {
  label: string
  displayLabel: string
  totalHours: number
  z0: number
  z1: number
  z2: number
  z3: number
  z4: number
  z5: number
}

function toChartData(points: ZoneProgressionPoint[], range: TimeRange): ChartPoint[] {
  return points.map((pt) => {
    const total = pt.totalHours

    let displayLabel = pt.label
    if (range === 'week' && pt.periodKey && pt.periodKey.length >= 10) {
      const day = pt.periodKey.slice(8, 10).replace(/^0/, '')
      displayLabel = `${pt.label} ${day}`
    }

    return {
      label: pt.label,
      displayLabel,
      totalHours: total,
      z0: pt.z0 !== null ? (pt.z0 / 100) * total : 0,
      z1: pt.z1 !== null ? (pt.z1 / 100) * total : 0,
      z2: pt.z2 !== null ? (pt.z2 / 100) * total : 0,
      z3: pt.z3 !== null ? (pt.z3 / 100) * total : 0,
      z4: pt.z4 !== null ? (pt.z4 / 100) * total : 0,
      z5: pt.z5 !== null ? (pt.z5 / 100) * total : 0,
    }
  })
}

function CustomTooltip({ active, payload, zoneNames }: any) {
  if (!active || !payload?.length) return null
  const pt: ChartPoint = payload[0]?.payload
  if (!pt || pt.totalHours === 0) return null

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 text-xs shadow-sm min-w-[160px]">
      <p className="font-medium text-gray-700 mb-2">{pt.displayLabel}</p>
      <p className="text-gray-400 mb-1.5">Total: {fmtHours(pt.totalHours)}</p>
      <div className="border-t border-[#f0f0f0] pt-1.5 space-y-0.5">
        {ZONE_KEYS.map((k) => {
          const h = pt[k]
          if (!h || h < 0.001) return null
          return (
            <p key={k} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: ZONE_COLORS[k] }} />
              <span className="text-gray-500">{zoneNames[k]}:</span>
              <span className="font-medium">{fmtHours(h)}</span>
            </p>
          )
        })}
      </div>
    </div>
  )
}

export function VolumeByZoneChart({ data, zoneNames, range }: VolumeByZoneChartProps) {
  const hasData = data.some((p) => p.totalHours > 0)
  if (!hasData) {
    return <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data</div>
  }

  const chartData = toChartData(data, range)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }} maxBarSize={32}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="displayLabel"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={(v) => v > 0 ? `${v}h` : ''}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={(props) => <CustomTooltip {...props} zoneNames={zoneNames} />} />
        {ZONE_KEYS.map((k) => (
          <Bar key={k} dataKey={k} stackId="zones" fill={ZONE_COLORS[k]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
