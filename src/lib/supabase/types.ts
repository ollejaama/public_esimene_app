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
  strava_id: number
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
  created_at: string
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

export interface SessionPayload {
  userId: string
  stravaAthleteId: number
}
