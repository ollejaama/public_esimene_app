export interface Profile {
  id: string
  user_id: string
  strava_athlete_id: number
  strava_access_token: string
  strava_refresh_token: string
  strava_token_expires_at: number
  last_synced_at: string | null
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  strava_id: number | null
  name: string
  sport_type: string
  custom_sport_tag: string | null
  start_date: string
  elapsed_time: number
  moving_time: number | null
  distance: number
  average_hr: number | null
  max_hr: number | null
  average_speed: number | null
  max_speed: number | null
  average_cadence: number | null
  total_elevation_gain: number | null
  has_hr_data: boolean
  has_gps_data: boolean
  notes: string | null
  overridden_duration: number | null
  overridden_sport_type: string | null
  intensity_type: 'regular' | 'interval' | 'speed' | 'competition' | null
  hidden: boolean
  contribution_hours: number | null
  is_manual: boolean
  created_at: string
  // Batch 3 fields
  rpe: number | null
  coach_comment: string | null
  coach_comment_at: string | null
  coach_comment_unread: boolean
  athlete_heart: boolean
  athlete_heart_at: string | null
  athlete_heart_unread: boolean
  manual_zone_seconds: { z0: number; z1: number; z2: number; z3: number; z4: number; z5: number } | null
}

export interface ActivityHRStream {
  id: string
  activity_id: string
  user_id: string
  hr_data: number[]
}

export interface ActivityGPSStream {
  id: string
  activity_id: string
  user_id: string
  latlng_data: [number, number][]
  elevation_data: number[] | null
}

export interface HRZoneSettings {
  id: string
  user_id: string
  zone1_max: number
  zone2_max: number
  zone3_max: number
  zone4_max: number
  zone1_name: string
  zone2_name: string
  zone3_name: string
  zone4_name: string
  zone5_name: string
  rest_day_threshold_minutes: number
  updated_at: string
}

export interface ActivityLap {
  id: string
  activity_id: string
  user_id: string
  lap_index: number
  distance: number
  elapsed_time: number
  moving_time: number | null
  average_speed: number | null
  average_hr: number | null
  max_hr: number | null
}

export interface PlannedActivity {
  id: string
  user_id: string
  date: string // 'YYYY-MM-DD'
  sport_type: string
  duration_minutes: number
  description: string | null
  time_of_day: 'morning' | 'evening'
  intensity_type: 'regular' | 'interval' | 'speed' | 'competition'
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  show_rpe: boolean
  rpe_scale: 'rpe' | 'borg'
  show_lactate: boolean
  created_at: string
  updated_at: string
}

export interface IllnessLog {
  id: string
  user_id: string
  category: 'sick' | 'injured' | 'fatigue'
  start_date: string  // 'YYYY-MM-DD'
  end_date: string    // 'YYYY-MM-DD'
  notes: string | null
  created_at: string
}

export interface LactateMeasurement {
  id: string
  activity_id: string
  user_id: string
  value_mmol: number
  created_at: string
}

export interface IntervalSet {
  id: string
  activity_id: string
  user_id: string
  set_order: number
  reps: number
  duration_secs: number
  zone: 'I2' | 'I3' | 'I4' | 'I5' | 'Progressive'
  created_at: string
}

export interface SessionPayload {
  userId: string
  stravaAthleteId: number
  role: 'athlete' | 'coach'
}
