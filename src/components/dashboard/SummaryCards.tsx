import { StatCard } from '@/components/ui/StatCard'
import { WeekSummary } from '@/lib/analytics/weekSummary'
import { formatDuration } from '@/lib/analytics/hrZones'

interface SummaryCardsProps {
  summary: WeekSummary
}

const CARD_SPORTS = [
  { key: 'total', label: 'Total Training' },
  { key: 'Running', label: 'Running' },
  { key: 'Skiing', label: 'Skiing' },
  { key: 'Strength', label: 'Strength' },
]

export function SummaryCards({ summary }: SummaryCardsProps) {
  function getCard(key: string, label: string) {
    if (key === 'total') {
      return (
        <StatCard
          key={key}
          label={label}
          value={formatDuration(summary.totalSeconds)}
          sub={`${summary.totalSessions} sessions`}
        />
      )
    }

    // Combine skiing-related sports
    const skiSports = ['Skiing', 'crosscountry_classic', 'cr_skate', 'rollerski_classic', 'rollerski_skate']
    let sports: string[]
    if (key === 'Skiing') {
      sports = skiSports
    } else {
      sports = [key]
    }

    const total = summary.bySport
      .filter((s) => sports.includes(s.key))
      .reduce((sum, s) => ({ seconds: sum.seconds + s.seconds, sessions: sum.sessions + s.sessions }), { seconds: 0, sessions: 0 })

    return (
      <StatCard
        key={key}
        label={label}
        value={formatDuration(total.seconds)}
        sub={`${total.sessions} sessions`}
      />
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {CARD_SPORTS.map(({ key, label }) => getCard(key, label))}
    </div>
  )
}
