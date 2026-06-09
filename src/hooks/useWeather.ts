import { useState, useEffect } from 'react';
import {
  fetchCurrentObservation,
  fetchHourlyForecast,
  type CurrentObservation,
  type HourlyPeriod,
} from '../api/weather';

interface WeatherState {
  current: CurrentObservation | null;
  hourly: HourlyPeriod[];
  loading: boolean;
  error: string | null;
}

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({
    current: null,
    hourly: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [current, hourly] = await Promise.all([
          fetchCurrentObservation(),
          fetchHourlyForecast(),
        ]);
        if (!cancelled) setState({ current, hourly, loading: false, error: null });
      } catch (e) {
        if (!cancelled)
          setState(s => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load weather',
          }));
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
