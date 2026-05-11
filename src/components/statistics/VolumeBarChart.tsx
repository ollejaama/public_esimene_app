'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { WeeklyVolumeBar } from '@/lib/analytics/volumeByWeek'
import { getSportColor } from '@/lib/analytics/volumeByWeek'
import { TimeRange } from './TimeRangeSelector'

interface VolumeBarChartProps {
  data: WeeklyVolumeBar[]
  sports: string[]
  range: TimeRange
}

const BAR_SIZE: Record<TimeRange, number> = {
  week: 24,
  month: 8,
  season: 20,
}

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

function formatTooltipLabel(label: string, periodKey?: string): string {
  if (!periodKey) return label
  if (/^\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
    const d = new Date(periodKey + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  if (/^\d{4}-W\d+$/.test(periodKey)) {
    const [year, w] = periodKey.split('-W')
    return `Week ${w}, ${year}`
  }
  return label
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const periodKey = payload[0]?.payload?.periodKey
  const total = payload.reduce((sum: number, p: any) => sum + Number(p.value), 0)
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 text-xs shadow-sm min-w-[140px]">
      <p className="font-medium text-gray-700">{formatTooltipLabel(label, periodKey)}</p>
      <p className="text-gray-400 mb-2">Total: {formatHours(total)}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{formatHours(Number(p.value))}</span>
        </p>
      ))}
    </div>
  )
}

export function VolumeBarChart({ data, sports, range }: VolumeBarChartProps) {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={BAR_SIZE[range]} barGap={2}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9f9f9' }} />
        {sports.map((sport) => (
          <Bar
            key={sport}
            dataKey={sport}
            stackId="a"
            fill={getSportColor(sport)}
            radius={sports.indexOf(sport) === sports.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
