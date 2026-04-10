'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface HRLineChartProps {
  hrData: number[]
}

// Downsample to at most maxPoints, keeping start and end
function downsample(data: number[], maxPoints: number): { t: number; bpm: number }[] {
  if (data.length <= maxPoints) {
    return data.map((bpm, i) => ({ t: i, bpm }))
  }
  const step = data.length / maxPoints
  const result: { t: number; bpm: number }[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step)
    result.push({ t: idx, bpm: data[idx] })
  }
  return result
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function HRLineChart({ hrData }: HRLineChartProps) {
  const points = downsample(hrData, 600)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="t"
          tickFormatter={formatTime}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          width={32}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          formatter={(value) => [`${value} bpm`, 'HR']}
          labelFormatter={(t) => formatTime(Number(t))}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e5e5' }}
        />
        <Line
          type="monotone"
          dataKey="bpm"
          stroke="#ef4444"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
