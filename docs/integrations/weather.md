# Weather Integration

> Status: Live — weather.gov (NWS) public API, no key required

## Coordinates

Hardcoded in `src/api/weather.ts`:
- Latitude: `42.073` (42°04'22.7"N)
- Longitude: `-86.5058` (86°30'20.9"W)

## API Flow

1. `GET https://api.weather.gov/points/{lat},{lon}` — resolves to a forecast office and returns URLs for:
   - `forecastHourly` — 24-hour period forecasts
   - `observationStations` — nearby ASOS/AWOS stations

2. `GET {observationStations}` — list of nearby stations (first used)

3. `GET https://api.weather.gov/stations/{id}/observations/latest` — current conditions:
   - Temperature (°C, converted to °F)
   - Wind speed and direction
   - Relative humidity
   - Text description + NWS icon URL

4. `GET {forecastHourly}` — hourly periods (first 24 used):
   - Temperature (°F)
   - Wind speed/direction string
   - Short forecast text + NWS icon URL
   - Precipitation probability

## Derived Values

- **Feels like**: wind chill when T ≤ 50°F and wind > 3 mph; heat index when T ≥ 80°F; otherwise same as temperature
- **Weather emoji**: mapped from NWS icon URL condition code (see `src/utils/weatherIcons.ts`)

## Limitations

- Air quality is not available from weather.gov — would require the EPA AirNow API (free, key required)
- Points cache is in-memory; the page must reload to refresh data
- Observation may lag by 30–60 minutes depending on station reporting interval

## Files

| File | Purpose |
|---|---|
| `src/api/weather.ts` | Fetch functions for current obs + hourly forecast |
| `src/hooks/useWeather.ts` | React hook that calls both endpoints in parallel |
| `src/utils/weatherIcons.ts` | NWS icon URL → emoji mapper + hour formatter |
| `src/components/CurrentWeatherTile.tsx` | Tile: temp, feels like, wind, humidity, station |
| `src/components/HourlyForecastTile.tsx` | Scrollable 24-hour strip |
| `src/pages/Weather.tsx` | Route `/weather` — composes both tiles |
