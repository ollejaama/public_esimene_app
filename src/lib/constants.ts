export const SPORT_COLORS: Record<string, string> = {
  Running: '#3b82f6',
  Skiing: '#93c5fd',
  Rollerski: '#2dd4bf',
  Strength: '#a855f7',
  Treadmill: '#9ca3af',
  Other: '#e5e7eb',
}

export const HR_ZONE_COLORS = ['#4ade80', '#86efac', '#facc15', '#fb923c', '#ef4444']

// Maps Strava sport_type values to display categories
export const SPORT_TYPE_MAP: Record<string, string> = {
  Run: 'Running',
  TrailRun: 'Running',
  VirtualRun: 'Running',
  Treadmill: 'Treadmill',
  NordicSki: 'Skiing',
  BackcountrySki: 'Skiing',
  WeightTraining: 'Strength',
  Workout: 'Strength',
}

export const CUSTOM_SPORT_TAGS = [
  'crosscountry_classic',
  'cr_skate',
  'rollerski_classic',
  'rollerski_skate',
] as const

export type CustomSportTag = (typeof CUSTOM_SPORT_TAGS)[number]

export const CUSTOM_SPORT_TAG_LABELS: Record<CustomSportTag, string> = {
  crosscountry_classic: 'Cross-country ski (classic)',
  cr_skate: 'Cross-country ski (skate)',
  rollerski_classic: 'Rollerski (classic)',
  rollerski_skate: 'Rollerski (skate)',
}

// Sport display rows for breakdown tables
export const SPORT_BREAKDOWN_ROWS = [
  { key: 'Running', label: 'Running' },
  { key: 'Treadmill', label: 'Treadmill' },
  { key: 'crosscountry_classic', label: 'Cross-country ski (classic)' },
  { key: 'cr_skate', label: 'Cross-country ski (skate)' },
  { key: 'rollerski_classic', label: 'Rollerski (classic)' },
  { key: 'rollerski_skate', label: 'Rollerski (skate)' },
  { key: 'Skiing', label: 'Skiing (untagged)' },
  { key: 'Strength', label: 'Strength' },
  { key: 'Other', label: 'Other' },
]

export const STRAVA_SCOPES = 'read,activity:read_all'
