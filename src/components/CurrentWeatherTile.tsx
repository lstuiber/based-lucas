import type { CurrentObservation } from '../api/weather';
import { getWeatherEmoji } from '../utils/weatherIcons';

interface Props {
  data: CurrentObservation;
}

export default function CurrentWeatherTile({ data }: Props) {
  const now = new Date();
  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour < 20;
  const emoji = getWeatherEmoji(data.iconUrl, isDaytime);

  const updatedAt = data.timestamp
    ? new Date(data.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div className="tile weather-current-tile">
      <div className="tile__label">Current Conditions</div>

      <div className="weather-icon">{emoji}</div>

      <div className="weather-temp">{data.temperature}°</div>
      <div className="weather-feels">Feels like {data.feelsLike}°F</div>

      {data.description && (
        <div className="weather-desc">{data.description}</div>
      )}

      <div className="weather-details">
        <div className="weather-detail">
          <span className="weather-detail__icon">💨</span>
          <span className="weather-detail__label">Wind</span>
          <span className="weather-detail__value">
            {data.windSpeedMph} mph {data.windDirectionStr}
          </span>
        </div>

        {data.humidity !== null && (
          <div className="weather-detail">
            <span className="weather-detail__icon">💧</span>
            <span className="weather-detail__label">Humidity</span>
            <span className="weather-detail__value">{data.humidity}%</span>
          </div>
        )}
      </div>

      <div className="weather-station">
        📍 {data.stationName}
        {updatedAt && <span className="weather-updated"> · {updatedAt}</span>}
      </div>
    </div>
  );
}
