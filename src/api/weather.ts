const LAT = 42.073;
const LON = -86.5058;
const BASE = 'https://api.weather.gov';

export interface CurrentObservation {
  temperature: number;
  feelsLike: number;
  humidity: number | null;
  windSpeedMph: number;
  windDirectionStr: string;
  description: string;
  iconUrl: string;
  timestamp: string;
  stationName: string;
}

export interface HourlyPeriod {
  startTime: string;
  temperature: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  iconUrl: string;
  isDaytime: boolean;
  precipProbability: number | null;
}

interface PointsMeta {
  forecastHourlyUrl: string;
  observationStationsUrl: string;
}

let pointsCache: PointsMeta | null = null;

async function getPoints(): Promise<PointsMeta> {
  if (pointsCache) return pointsCache;
  const res = await fetch(`${BASE}/points/${LAT},${LON}`, {
    headers: { 'User-Agent': 'based-lucas-app lucasstuiber@gmail.com' },
  });
  if (!res.ok) throw new Error(`weather.gov points error: ${res.status}`);
  const data = await res.json();
  pointsCache = {
    forecastHourlyUrl: data.properties.forecastHourly,
    observationStationsUrl: data.properties.observationStations,
  };
  return pointsCache;
}

function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

function toMph(value: number, unitCode: string): number {
  if (unitCode.includes('km_h') || unitCode.includes('km/h')) return value * 0.621371;
  if (unitCode.includes('m_s') || unitCode.includes('m/s')) return value * 2.23694;
  return value;
}

function windChill(tempF: number, windMph: number): number {
  return (
    35.74 +
    0.6215 * tempF -
    35.75 * Math.pow(windMph, 0.16) +
    0.4275 * tempF * Math.pow(windMph, 0.16)
  );
}

function heatIndex(tempF: number, rh: number): number {
  const T = tempF, R = rh;
  return (
    -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R -
    0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R +
    0.00085282 * T * R * R - 0.00000199 * T * T * R * R
  );
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export async function fetchCurrentObservation(): Promise<CurrentObservation> {
  const { observationStationsUrl } = await getPoints();

  const stationsRes = await fetch(observationStationsUrl, {
    headers: { 'User-Agent': 'based-lucas-app lucasstuiber@gmail.com' },
  });
  if (!stationsRes.ok) throw new Error(`stations error: ${stationsRes.status}`);
  const stationsData = await stationsRes.json();
  const station = stationsData.features[0];
  const stationId: string = station.properties.stationIdentifier;
  const stationName: string = station.properties.name;

  const obsRes = await fetch(`${BASE}/stations/${stationId}/observations/latest`, {
    headers: { 'User-Agent': 'based-lucas-app lucasstuiber@gmail.com' },
  });
  if (!obsRes.ok) throw new Error(`observation error: ${obsRes.status}`);
  const obsData = await obsRes.json();
  const p = obsData.properties;

  const tempC: number = p.temperature.value ?? 0;
  const tempF = cToF(tempC);

  const windMph =
    p.windSpeed?.value != null
      ? toMph(p.windSpeed.value, p.windSpeed.unitCode ?? '')
      : 0;

  const humidity: number | null = p.relativeHumidity?.value ?? null;
  const windDeg: number = p.windDirection?.value ?? 0;

  let feelsLike = tempF;
  if (tempF <= 50 && windMph > 3) {
    feelsLike = windChill(tempF, windMph);
  } else if (tempF >= 80 && humidity !== null) {
    feelsLike = heatIndex(tempF, humidity);
  }

  return {
    temperature: Math.round(tempF),
    feelsLike: Math.round(feelsLike),
    humidity: humidity !== null ? Math.round(humidity) : null,
    windSpeedMph: Math.round(windMph),
    windDirectionStr: windDeg ? degToCompass(windDeg) : '—',
    description: p.textDescription ?? '',
    iconUrl: p.icon ?? '',
    timestamp: p.timestamp ?? '',
    stationName,
  };
}

export async function fetchHourlyForecast(): Promise<HourlyPeriod[]> {
  const { forecastHourlyUrl } = await getPoints();
  const res = await fetch(forecastHourlyUrl, {
    headers: { 'User-Agent': 'based-lucas-app lucasstuiber@gmail.com' },
  });
  if (!res.ok) throw new Error(`hourly forecast error: ${res.status}`);
  const data = await res.json();

  return data.properties.periods.slice(0, 24).map((p: Record<string, unknown>) => ({
    startTime: p.startTime as string,
    temperature: p.temperature as number,
    windSpeed: p.windSpeed as string,
    windDirection: p.windDirection as string,
    shortForecast: p.shortForecast as string,
    iconUrl: p.icon as string,
    isDaytime: p.isDaytime as boolean,
    precipProbability:
      (p.probabilityOfPrecipitation as { value: number | null } | null)?.value ?? null,
  }));
}
