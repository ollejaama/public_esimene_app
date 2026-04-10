export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: string
  athlete: StravaAthlete
}

export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  profile: string  // avatar URL
  username: string
}

export interface StravaActivity {
  id: number
  name: string
  sport_type: string
  start_date: string
  elapsed_time: number
  moving_time: number
  distance: number
  average_heartrate?: number
  max_heartrate?: number
  average_speed?: number
  max_speed?: number
  average_cadence?: number
  total_elevation_gain?: number
  has_heartrate: boolean
  map?: {
    summary_polyline?: string
  }
}

export interface StravaLap {
  id: number
  lap_index: number
  name: string
  elapsed_time: number
  moving_time: number
  distance: number
  average_speed: number
  average_heartrate?: number
  max_heartrate?: number
}

export interface StravaStream {
  type: string
  data: number[] | [number, number][]
  series_type: string
  original_size: number
  resolution: string
}
