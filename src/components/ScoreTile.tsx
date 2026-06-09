import { useState, useEffect, useRef } from 'react'
import type { DailyScore, Averages } from '../types/oura'

interface Props {
  label: string
  data: DailyScore | null
  loading: boolean
  error: string | null
  fetchAverages: () => Promise<Averages>
}

function scoreLevel(score: number): 'good' | 'fair' | 'poor' {
  if (score >= 85) return 'good'
  if (score >= 70) return 'fair'
  return 'poor'
}

function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function TrendIcon({ today, avg, size }: { today: number; avg: number | null; size: 'lg' | 'sm' }) {
  if (avg === null) return null
  const diff = today - avg
  const cls = `tile__trend tile__trend--${size}`
  if (diff > 0) return <span className={`${cls} tile__trend--up`}>↑</span>
  if (diff < 0) return <span className={`${cls} tile__trend--down`}>↓</span>
  return <span className={`${cls} tile__trend--neutral`}>=</span>
}

export default function ScoreTile({ label, data, loading, error, fetchAverages }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [averages, setAverages] = useState<Averages | null>(null)
  const [avgsLoading, setAvgsLoading] = useState(false)
  const [avgsError, setAvgsError] = useState<string | null>(null)

  // Keep a stable ref to the latest fetchAverages so the effect only re-runs when data arrives.
  const fetchAveragesRef = useRef(fetchAverages)
  useEffect(() => { fetchAveragesRef.current = fetchAverages })

  const fetchedRef = useRef(false)
  useEffect(() => {
    if (!data || data.score == null || fetchedRef.current) return
    fetchedRef.current = true
    setAvgsLoading(true)
    fetchAveragesRef.current()
      .then(setAverages)
      .catch(e => setAvgsError((e as Error).message))
      .finally(() => setAvgsLoading(false))
  }, [data])

  function handleClick() {
    if (loading || !data) return
    setExpanded(e => !e)
  }

  if (loading) {
    return (
      <div className="tile tile--loading">
        <div className="tile__label">{label}</div>
        <div className="tile__score">--</div>
        <div className="tile__date">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tile tile--loading">
        <div className="tile__label">{label}</div>
        <div className="tile__score">--</div>
        <div className="tile__date">{error}</div>
      </div>
    )
  }

  if (!data || data.score == null) {
    return (
      <div className="tile tile--loading">
        <div className="tile__label">{label}</div>
        <div className="tile__score">--</div>
        <div className="tile__date">No data yet</div>
      </div>
    )
  }

  const level = scoreLevel(data.score)
  return (
    <div
      className={`tile tile--${level} tile--clickable`}
      onClick={handleClick}
      role="button"
      aria-expanded={expanded}
    >
      <div className="tile__label">{label}</div>
      <div className="tile__score-row">
        <span className="tile__score">{data.score}</span>
        {!avgsLoading && averages && (
          <TrendIcon today={data.score} avg={averages.avg7} size="lg" />
        )}
      </div>
      <div className="tile__date">{formatDay(data.day)}</div>

      {expanded && (
        <div className="tile__averages">
          {avgsLoading && <div className="tile__avgs-loading">Loading…</div>}
          {avgsError && <div className="tile__avgs-loading">{avgsError}</div>}
          {averages && (
            <>
              <div className="tile__avg-row">
                <span className="tile__avg-label">7d avg</span>
                <span className="tile__avg-value">
                  {averages.avg7 ?? '--'}
                  {averages.avg7 != null && <TrendIcon today={data.score} avg={averages.avg7} size="sm" />}
                </span>
              </div>
              <div className="tile__avg-row">
                <span className="tile__avg-label">30d avg</span>
                <span className="tile__avg-value">
                  {averages.avg30 ?? '--'}
                  {averages.avg30 != null && <TrendIcon today={data.score} avg={averages.avg30} size="sm" />}
                </span>
              </div>
              <div className="tile__avg-row">
                <span className="tile__avg-label">90d avg</span>
                <span className="tile__avg-value">
                  {averages.avg90 ?? '--'}
                  {averages.avg90 != null && <TrendIcon today={data.score} avg={averages.avg90} size="sm" />}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
