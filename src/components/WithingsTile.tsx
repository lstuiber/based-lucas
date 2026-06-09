import { useState } from 'react'
import type { WithingsMeasures } from '../types/withings'

interface Props {
  data: WithingsMeasures | null
  loading: boolean
  error: string | null
  notConnected: boolean
  onConnect: () => void
}

function formatDate(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function lbs(val: number | null): string {
  return val !== null ? `${val} lbs` : '--'
}

export default function WithingsTile({ data, loading, error, notConnected, onConnect }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (notConnected) {
    return (
      <div className="tile tile--loading withings-tile">
        <div className="tile__label">Withings</div>
        <div className="tile__score withings-tile__connect-score">--</div>
        <button className="withings-tile__connect-btn" onClick={onConnect}>
          Connect Withings
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="tile tile--loading withings-tile">
        <div className="tile__label">Weight</div>
        <div className="tile__score">--</div>
        <div className="tile__date">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tile tile--loading withings-tile">
        <div className="tile__label">Weight</div>
        <div className="tile__score">--</div>
        <div className="tile__date">{error}</div>
      </div>
    )
  }

  if (!data || data.weight === null) {
    return (
      <div className="tile tile--loading withings-tile">
        <div className="tile__label">Weight</div>
        <div className="tile__score">--</div>
        <div className="tile__date">No data yet</div>
      </div>
    )
  }

  const hasComposition = data.muscle !== null || data.fat !== null || data.water !== null

  return (
    <div
      className={`tile withings-tile${hasComposition ? ' tile--clickable' : ''}`}
      onClick={() => hasComposition && setExpanded(e => !e)}
      role={hasComposition ? 'button' : undefined}
      aria-expanded={hasComposition ? expanded : undefined}
    >
      <div className="tile__label">Weight</div>
      <div className="tile__score-row">
        <span className="tile__score withings-tile__weight">{data.weight}</span>
        <span className="withings-tile__unit">lbs</span>
      </div>
      <div className="tile__date">{formatDate(data.date)}</div>

      {expanded && hasComposition && (
        <div className="tile__averages">
          <div className="tile__avg-row">
            <span className="tile__avg-label">Muscle</span>
            <span className="tile__avg-value">{lbs(data.muscle)}</span>
          </div>
          <div className="tile__avg-row">
            <span className="tile__avg-label">Fat</span>
            <span className="tile__avg-value">{lbs(data.fat)}</span>
          </div>
          <div className="tile__avg-row">
            <span className="tile__avg-label">Water</span>
            <span className="tile__avg-value">{data.water !== null ? `${data.water}%` : '--'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
