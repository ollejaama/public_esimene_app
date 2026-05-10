interface SportIconProps {
  sportKey: string
  className?: string
}

export function SportIcon({ sportKey, className = 'w-3 h-3' }: SportIconProps) {
  // Running
  if (sportKey === 'Running' || sportKey === 'Treadmill') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4.5 6.28l-2.84-1.7-.57-.34L13.5 7H10c-.55 0-1 .45-1 1v5h2v-3.5l2 1.2V17H9v2h8v-2h-3v-3.78l2.5 1.5L18 17h2l-2-5.22z" />
      </svg>
    )
  }

  // All skiing and rollerski variants
  if (
    sportKey === 'Skiing' ||
    sportKey === 'crosscountry_classic' ||
    sportKey === 'cr_skate' ||
    sportKey === 'treadmill_skiing' ||
    sportKey === 'imitation' ||
    sportKey === 'Rollerski' ||
    sportKey === 'rollerski_classic' ||
    sportKey === 'rollerski_skate'
  ) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="4" x2="20" y2="20" />
        <line x1="20" y1="4" x2="4" y2="20" />
        <line x1="2" y1="6" x2="6" y2="2" />
        <line x1="18" y1="22" x2="22" y2="18" />
        <line x1="22" y1="6" x2="18" y2="2" />
        <line x1="6" y1="22" x2="2" y2="18" />
      </svg>
    )
  }

  // Strength
  if (sportKey === 'Strength') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z" />
      </svg>
    )
  }

  // Cycling
  if (sportKey === 'Cycling') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4C7.3 8.8 7 9.4 7 10c0 .6.3 1.2.8 1.6l3.3 2.4V18h2v-5l-3.3-2.5zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
      </svg>
    )
  }

  // Default dot
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
    </svg>
  )
}
