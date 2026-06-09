import type { HourlyPeriod } from '../api/weather';
import { getWeatherEmoji, formatHour } from '../utils/weatherIcons';

interface Props {
  periods: HourlyPeriod[];
}

export default function HourlyForecastTile({ periods }: Props) {
  return (
    <div className="tile weather-hourly-tile">
      <div className="tile__label">Hourly Forecast</div>
      <div className="weather-hourly-scroll">
        {periods.map((p) => {
          const emoji = getWeatherEmoji(p.iconUrl, p.isDaytime);
          const label = formatHour(p.startTime);
          const precip = p.precipProbability;

          return (
            <div key={p.startTime} className="weather-hour">
              <div className="weather-hour__time">{label}</div>
              <div className="weather-hour__icon">{emoji}</div>
              <div className="weather-hour__temp">{p.temperature}°</div>
              <div className="weather-hour__wind">{p.windSpeed}</div>
              {precip !== null && precip > 0 ? (
                <div className="weather-hour__precip">💧 {precip}%</div>
              ) : (
                <div className="weather-hour__precip weather-hour__precip--none">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
