'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { WeeklyVolumeBar } from '@/lib/analytics/volumeByWeek'
import { getSportColor } from '@/lib/analytics/volumeByWeek'

interface VolumeBarChartProps {
  data: WeeklyVolumeBar[]
  sports: string[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 text-xs shadow-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{Number(p.value).toFixed(1)}h</span>
        </p>
      ))}
    </div>
  )
}

export function VolumeBarChart({ data, sports }: VolumeBarChartProps) {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barSize={16} barGap={2}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="weekLabel"
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
