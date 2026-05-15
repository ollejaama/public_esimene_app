import { IllnessLog } from '@/lib/supabase/types'

interface IllnessWidgetProps {
  illnessEntries: IllnessLog[]
  start: Date
  end: Date
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  sick: { label: 'Sick', color: '#ef4444' },
  injured: { label: 'Injured', color: '#fb923c' },
  fatigue: { label: 'Fatigue', color: '#facc15' },
}

function countAffectedDays(entries: IllnessLog[], start: Date, end: Date): number {
  const affected = new Set<string>()
  const cursor = new Date(start)
  while (cursor < end) {
    const key = cursor.toISOString().slice(0, 10)
    for (const e of entries) {
      if (e.start_date <= key && e.end_date >= key) {
        affected.add(key)
        break
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return affected.size
}

function countByCategory(entries: IllnessLog[], start: Date, end: Date, category: string): number {
  const filtered = entries.filter((e) => e.category === category)
  return countAffectedDays(filtered, start, end)
}

export function IllnessWidget({ illnessEntries, start, end }: IllnessWidgetProps) {
  if (illnessEntries.length === 0) {
    return (
      <div className="flex flex-col items-center py-3 px-2">
        <span className="text-3xl font-bold text-gray-900 leading-none">0</span>
        <span className="text-xs text-gray-400 mt-0.5">affected days</span>
      </div>
    )
  }

  const total = countAffectedDays(illnessEntries, start, end)
  const breakdown = Object.entries(CATEGORY_META).map(([cat, meta]) => ({
    ...meta,
    count: countByCategory(illnessEntries, start, end, cat),
  })).filter((b) => b.count > 0)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900 leading-none">{total}</span>
        <span className="text-xs text-gray-400 mb-0.5">affected days</span>
      </div>
      {breakdown.length > 0 && (
        <div className="space-y-1">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
              <span className="text-gray-600 flex-1">{b.label}</span>
              <span className="font-medium text-gray-800">{b.count}d</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
