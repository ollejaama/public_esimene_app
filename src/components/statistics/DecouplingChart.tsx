'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity } from '@/lib/supabase/types'

type TimeRange = 'week' | 'month' | 'season' | 'all'

interface DecouplingChartProps {
  activities: Activity[]
  range: TimeRange
  start: Date
  end: Date
}

interface DataPoint {
  label: string
  avg: number
}

function toLocalKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildData(activities: Activity[], range: TimeRange, start: Date, end: Date): DataPoint[] {
  const withDecoupling = activities.filter((a) => a.decoupling_percent != null)
  if (withDecoupling.length === 0) return []

  if (range === 'week') {
    // Each day
    const map = new Map<string, number[]>()
    for (const a of withDecoupling) {
      const key = a.start_date.slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(a.decoupling_percent!)
      map.set(key, arr)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => ({
        label: key.slice(5),
        avg: vals.reduce((s, v) => s + v, 0) / vals.length,
      }))
  }

  if (range === 'month') {
    // Group by week of month
    const map = new Map<string, number[]>()
    for (const a of withDecoupling) {
      const d = new Date(a.start_date)
      const weekNum = Math.ceil(d.getDate() / 7)
      const key = `W${weekNum}`
      const arr = map.get(key) ?? []
      arr.push(a.decoupling_percent!)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([key, vals]) => ({
      label: key,
      avg: vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
  }

  // season / all — group by month
  const map = new Map<string, number[]>()
  for (const a of withDecoupling) {
    const key = a.start_date.slice(0, 7)
    const arr = map.get(key) ?? []
    arr.push(a.decoupling_percent!)
    map.set(key, arr)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({
      label: key.slice(5),
      avg: vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}

export function DecouplingChart({ activities, range, start, end }: DecouplingChartProps) {
  const data = buildData(activities, range, start, end)

  if (data.length === 0) {
    return <p className="text-xs text-gray-400">No decoupling data — expand activities to compute</p>
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
        <Tooltip
          formatter={(v: unknown) => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Avg decoupling'] as [string, string]}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
        />
        <ReferenceLine y={5} stroke="#facc15" strokeDasharray="4 2" strokeWidth={1} />
        <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3, fill: '#6366f1' }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
