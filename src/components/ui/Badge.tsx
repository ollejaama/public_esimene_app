interface BadgeProps {
  label: string
  color: string
  muted?: boolean
}

export function Badge({ label, color, muted = false }: BadgeProps) {
  if (muted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-normal italic text-gray-400 bg-gray-100">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-300" />
        {label}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-gray-700"
      style={{ backgroundColor: `${color}25` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
