'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LactateDataPoint {
  date: string
  avg_mmol: number
}

interface LactateChartProps {
  data: LactateDataPoint[]
}

export function LactateChart({ data }: LactateChartProps) {
  if (data.length === 0) {
    return <p className="text-xs text-gray-400">No lactate data recorded</p>
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v.toFixed(1)}`}
          unit=" mmol"
        />
        <Tooltip
          formatter={(v: unknown) => [`${typeof v === 'number' ? v.toFixed(2) : v} mmol/L`, 'Avg lactate'] as [string, string]}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
        />
        <Line
          type="monotone"
          dataKey="avg_mmol"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3b82f6' }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
