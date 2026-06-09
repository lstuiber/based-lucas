export interface Averages {
  avg7: number | null
  avg30: number | null
  avg90: number | null
}

// Shared shape used by ScoreTile — all daily score types satisfy this
export interface DailyScore {
  id: string
  day: string
  score: number | null
  timestamp: string
}

export interface SleepContributors {
  deep_sleep: number | null
  efficiency: number | null
  latency: number | null
  rem_sleep: number | null
  restfulness: number | null
  timing: number | null
  total_sleep: number | null
}

export interface ReadinessContributors {
  activity_balance: number | null
  body_temperature: number | null
  hrv_balance: number | null
  previous_day_activity: number | null
  previous_night: number | null
  recovery_index: number | null
  resting_heart_rate: number | null
  sleep_balance: number | null
}

export interface ActivityContributors {
  meet_daily_targets: number | null
  move_every_hour: number | null
  recovery_time: number | null
  stay_active: number | null
  training_frequency: number | null
  training_volume: number | null
}

export interface DailySleep extends DailyScore {
  contributors: SleepContributors
}

export interface DailyReadiness extends DailyScore {
  contributors: ReadinessContributors
  temperature_deviation: number | null
  temperature_trend_deviation: number | null
}

export interface DailyActivity extends DailyScore {
  contributors: ActivityContributors
  steps: number | null
  active_calories: number | null
  total_calories: number | null
}
