interface ActivityTypeBadgeProps {
  intensityType: 'interval' | 'speed' | 'competition'
}

export function ActivityTypeBadge({ intensityType }: ActivityTypeBadgeProps) {
  if (intensityType === 'interval') {
    return (
      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-600 leading-none flex-shrink-0">
        INT
      </span>
    )
  }
  if (intensityType === 'speed') {
    return (
      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-100 text-blue-600 leading-none flex-shrink-0">
        SPD
      </span>
    )
  }
  return (
    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 leading-none flex-shrink-0">
      ★ COMP
    </span>
  )
}
