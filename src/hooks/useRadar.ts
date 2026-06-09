import { useState, useEffect } from 'react';

export interface RadarFrame {
  time: number;
  path: string;
  isForecast: boolean;
}

export interface RadarData {
  host: string;
  frames: RadarFrame[];
  pastCount: number; // how many frames are past vs forecast
}

export function useRadar(): { data: RadarData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(r => {
        if (!r.ok) throw new Error(`RainViewer API error: ${r.status}`);
        return r.json();
      })
      .then(d => {
        const past: RadarFrame[] = d.radar.past.map((f: { time: number; path: string }) => ({
          ...f,
          isForecast: false,
        }));
        const nowcast: RadarFrame[] = (d.radar.nowcast ?? []).map((f: { time: number; path: string }) => ({
          ...f,
          isForecast: true,
        }));
        setData({
          host: d.host,
          frames: [...past, ...nowcast],
          pastCount: past.length,
        });
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
