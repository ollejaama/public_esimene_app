export const SPORT_COLORS: Record<string, string> = {
  Running: '#3b82f6',
  Skiing: '#93c5fd',
  Rollerski: '#2dd4bf',
  Strength: '#a855f7',
  Treadmill: '#9ca3af',
  'Treadmill running': '#9ca3af',
  'Treadmill classic': '#9ca3af',
  'Treadmill skate': '#9ca3af',
  Imitation: '#e5e7eb',
  Cycling: '#f97316',
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
  Ride: 'Cycling',
  VirtualRide: 'Cycling',
  EBikeRide: 'Cycling',
}

export const CUSTOM_SPORT_TAGS = [
  'crosscountry_classic',
  'cr_skate',
  'rollerski_classic',
  'rollerski_skate',
  'treadmill_classic',
  'treadmill_skate',
  'strength_basic',
] as const

export type CustomSportTag = (typeof CUSTOM_SPORT_TAGS)[number]

export const CUSTOM_SPORT_TAG_LABELS: Record<CustomSportTag, string> = {
  crosscountry_classic: 'Cross-country classic',
  cr_skate: 'Cross-country skate',
  rollerski_classic: 'Rollerski classic',
  rollerski_skate: 'Rollerski skate',
  treadmill_classic: 'Treadmill classic',
  treadmill_skate: 'Treadmill skate',
  strength_basic: 'Basic strength',
}

// Maps custom sport tags to their SPORT_COLORS key
export const CUSTOM_TAG_COLOR_KEY: Record<string, string> = {
  crosscountry_classic: 'Skiing',
  cr_skate: 'Skiing',
  rollerski_classic: 'Rollerski',
  rollerski_skate: 'Rollerski',
  treadmill_classic: 'Treadmill',
  treadmill_skate: 'Treadmill',
  strength_basic: 'Strength',
}

// Sport display rows for breakdown tables
export const SPORT_BREAKDOWN_ROWS = [
  { key: 'Running', label: 'Running' },
  { key: 'Treadmill', label: 'Treadmill' },
  { key: 'crosscountry_classic', label: 'Cross-country classic' },
  { key: 'cr_skate', label: 'Cross-country skate' },
  { key: 'rollerski_classic', label: 'Rollerski classic' },
  { key: 'rollerski_skate', label: 'Rollerski skate' },
  { key: 'treadmill_classic', label: 'Treadmill classic' },
  { key: 'treadmill_skate', label: 'Treadmill skate' },
  { key: 'Skiing', label: 'Skiing (untagged)' },
  { key: 'Strength', label: 'Strength' },
  { key: 'strength_basic', label: 'Basic strength' },
  { key: 'Cycling', label: 'Cycling' },
  { key: 'Other', label: 'Other' },
]

export const PLANNED_SPORT_TYPES = [
  'Cross-country classic',
  'Cross-country skate',
  'Rollerski classic',
  'Rollerski skate',
  'Running',
  'Strength',
  'Basic strength',
  'Treadmill running',
  'Treadmill classic',
  'Treadmill skate',
  'Imitation',
  'Cycling',
  'Other',
] as const

export type PlannedSportType = (typeof PLANNED_SPORT_TYPES)[number]

export const PLANNED_SPORT_COLOR_KEY: Record<string, string> = {
  'Cross-country classic':  'Skiing',
  'Cross-country skate':    'Skiing',
  'Rollerski classic':      'Rollerski',
  'Rollerski skate':        'Rollerski',
  'Running':                'Running',
  'Strength':               'Strength',
  'Basic strength':         'Strength',
  'Treadmill running':      'Treadmill',
  'Treadmill classic':      'Treadmill',
  'Treadmill skate':        'Treadmill',
  'Imitation':              'Other',
  'Cycling':                'Cycling',
  'Other':                  'Other',
}

export const STRAVA_SCOPES = 'read,activity:read_all'
