interface RestDaysWidgetProps {
  restDayCount: number
  thresholdMinutes: number
}

export function RestDaysWidget({ restDayCount, thresholdMinutes }: RestDaysWidgetProps) {
  const label = thresholdMinutes === 0
    ? 'Rest days'
    : `Under ${thresholdMinutes}min`

  return (
    <div className="flex flex-col items-center py-3 px-2">
      <span className="text-xl font-semibold text-gray-700">{restDayCount}</span>
      <span className="text-xs mt-0.5 px-1.5 py-0.5 rounded-full font-medium text-gray-500 bg-gray-100">
        {label}
      </span>
    </div>
  )
}
