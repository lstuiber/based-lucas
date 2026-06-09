import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOuraAuth } from '../hooks/useOuraAuth'
import { useWithingsAuth } from '../hooks/useWithingsAuth'
import {
  fetchDailySleep,
  fetchDailyReadiness,
  fetchDailyActivity,
  fetchSleepAverages,
  fetchReadinessAverages,
  fetchActivityAverages,
  refreshAccessToken,
} from '../api/oura'
import { fetchWithingsMeasures, refreshWithingsToken } from '../api/withings'
import ScoreTile from '../components/ScoreTile'
import WithingsTile from '../components/WithingsTile'
import CurrentWeatherTile from '../components/CurrentWeatherTile'
import HourlyForecastTile from '../components/HourlyForecastTile'
import { useWeather } from '../hooks/useWeather'
import type { DailySleep, DailyReadiness, DailyActivity } from '../types/oura'
import type { WithingsMeasures } from '../types/withings'

const OURA_REDIRECT_URI = 'http://localhost:5173/'
const OURA_SCOPES = ['daily', 'heartrate', 'personal']
const OURA_AUTH_URL =
  `https://cloud.ouraring.com/oauth/authorize?` +
  `client_id=${import.meta.env.VITE_oura_client_id}&` +
  `redirect_uri=${encodeURIComponent(OURA_REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${OURA_SCOPES.join(' ')}`

const WITHINGS_AUTH_URL =
  `https://account.withings.com/oauth2_user/authorize2?` +
  `response_type=code&` +
  `client_id=${import.meta.env.VITE_withings_client_id}&` +
  `state=withings&` +
  `scope=user.metrics&` +
  `redirect_uri=${encodeURIComponent('http://localhost:5173/')}`

interface Scores {
  sleep: DailySleep | null
  readiness: DailyReadiness | null
  activity: DailyActivity | null
}

interface Errors {
  sleep: string | null
  readiness: string | null
  activity: string | null
}

const NO_SCORES: Scores = { sleep: null, readiness: null, activity: null }
const NO_ERRORS: Errors = { sleep: null, readiness: null, activity: null }

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // Route the callback code to the correct service based on state param
  const ouraCode = state !== 'withings' ? code : null
  const withingsCode = state === 'withings' ? code : null

  const { accessToken: ouraToken, loading: ouraAuthLoading, error: ouraAuthError } = useOuraAuth(ouraCode)
  const { accessToken: withingsToken, loading: withingsAuthLoading, error: withingsAuthError } = useWithingsAuth(withingsCode)

  // Oura score state
  const [scores, setScores] = useState<Scores>(NO_SCORES)
  const [errors, setErrors] = useState<Errors>(NO_ERRORS)
  const [scoresLoading, setScoresLoading] = useState(false)
  const scoresFetched = useRef(false)

  const { current: weatherCurrent, hourly: weatherHourly, loading: weatherLoading } = useWeather()

  // Withings state
  const [withingsData, setWithingsData] = useState<WithingsMeasures | null>(null)
  const [withingsLoading, setWithingsLoading] = useState(false)
  const [withingsError, setWithingsError] = useState<string | null>(null)
  const withingsFetched = useRef(false)

  // Clear code/state from URL once a token is obtained
  useEffect(() => {
    if (code && (ouraToken || withingsToken)) {
      setSearchParams({}, { replace: true })
    }
  }, [code, ouraToken, withingsToken, setSearchParams])

  // Fetch Oura scores
  useEffect(() => {
    if (!ouraToken || scoresFetched.current) return
    scoresFetched.current = true

    async function loadScores(token: string) {
      setScoresLoading(true)

      const [sleepResult, readinessResult, activityResult] = await Promise.allSettled([
        fetchDailySleep(token),
        fetchDailyReadiness(token),
        fetchDailyActivity(token),
      ])

      const needsRefresh = [sleepResult, readinessResult, activityResult].some(
        r => r.status === 'rejected' && r.reason.message === 'UNAUTHORIZED'
      )

      if (needsRefresh) {
        try {
          const { access_token: newToken } = await refreshAccessToken()
          const [s, r, a] = await Promise.allSettled([
            fetchDailySleep(newToken),
            fetchDailyReadiness(newToken),
            fetchDailyActivity(newToken),
          ])
          applyResults(s, r, a)
        } catch {
          setErrors({ sleep: 'Session expired', readiness: 'Session expired', activity: 'Session expired' })
        }
      } else {
        applyResults(sleepResult, readinessResult, activityResult)
      }

      setScoresLoading(false)
    }

    function applyResults(
      sleepResult: PromiseSettledResult<DailySleep | null>,
      readinessResult: PromiseSettledResult<DailyReadiness | null>,
      activityResult: PromiseSettledResult<DailyActivity | null>
    ) {
      setScores({
        sleep: sleepResult.status === 'fulfilled' ? sleepResult.value : null,
        readiness: readinessResult.status === 'fulfilled' ? readinessResult.value : null,
        activity: activityResult.status === 'fulfilled' ? activityResult.value : null,
      })
      setErrors({
        sleep: sleepResult.status === 'rejected' ? sleepResult.reason.message : null,
        readiness: readinessResult.status === 'rejected' ? readinessResult.reason.message : null,
        activity: activityResult.status === 'rejected' ? activityResult.reason.message : null,
      })
    }

    loadScores(ouraToken)
  }, [ouraToken])

  // Fetch Withings measures
  useEffect(() => {
    if (!withingsToken || withingsFetched.current) return
    withingsFetched.current = true
    setWithingsLoading(true)

    fetchWithingsMeasures(withingsToken)
      .then(setWithingsData)
      .catch(async (e: Error) => {
        if (e.message === 'UNAUTHORIZED') {
          try {
            const { access_token: newToken } = await refreshWithingsToken()
            const data = await fetchWithingsMeasures(newToken)
            setWithingsData(data)
          } catch {
            setWithingsError('Session expired')
          }
        } else {
          setWithingsError(e.message)
        }
      })
      .finally(() => setWithingsLoading(false))
  }, [withingsToken])

  return (
    <div className="tiles">
      {ouraAuthLoading ? (
        <>
          <ScoreTile label="Sleep" data={null} loading={true} error={null} fetchAverages={() => Promise.resolve({ avg7: null, avg30: null, avg90: null })} />
          <ScoreTile label="Readiness" data={null} loading={true} error={null} fetchAverages={() => Promise.resolve({ avg7: null, avg30: null, avg90: null })} />
          <ScoreTile label="Activity" data={null} loading={true} error={null} fetchAverages={() => Promise.resolve({ avg7: null, avg30: null, avg90: null })} />
        </>
      ) : ouraAuthError ? (
        <div className="tile tile--loading">
          <div className="tile__label">Oura</div>
          <div className="tile__score">--</div>
          <button onClick={() => { window.location.href = OURA_AUTH_URL }}>
            Connect Oura
          </button>
        </div>
      ) : (
        <>
          <ScoreTile label="Sleep" data={scores.sleep} loading={scoresLoading} error={errors.sleep} fetchAverages={() => fetchSleepAverages(ouraToken!)} />
          <ScoreTile label="Readiness" data={scores.readiness} loading={scoresLoading} error={errors.readiness} fetchAverages={() => fetchReadinessAverages(ouraToken!)} />
          <ScoreTile label="Activity" data={scores.activity} loading={scoresLoading} error={errors.activity} fetchAverages={() => fetchActivityAverages(ouraToken!)} />
        </>
      )}

      <WithingsTile
        data={withingsData}
        loading={withingsAuthLoading || withingsLoading}
        error={withingsError}
        notConnected={!!withingsAuthError && !withingsAuthLoading}
        onConnect={() => { window.location.href = WITHINGS_AUTH_URL }}
      />

      {weatherLoading ? (
        <div className="tile tile--loading weather-current-tile">
          <div className="tile__label">Current Conditions</div>
          <div className="weather-icon">🌡️</div>
          <div className="weather-temp" style={{ color: '#555' }}>—°</div>
        </div>
      ) : weatherCurrent ? (
        <CurrentWeatherTile data={weatherCurrent} />
      ) : null}

      {!weatherLoading && weatherHourly.length > 0 && (
        <HourlyForecastTile periods={weatherHourly} />
      )}
    </div>
  )
}
