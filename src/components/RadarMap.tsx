import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { RadarFrame } from '../hooks/useRadar';
import L from 'leaflet';

// Fix Leaflet's broken default icon paths under Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LAT = 42.073;
const LON = -86.5058;
const COLOR = 6; // NEXRAD L3 color scheme
const OPACITY = 0.7;

interface RadarLayerProps {
  host: string;
  frames: RadarFrame[];
  frameIndex: number;
}

function RadarLayer({ host, frames, frameIndex }: RadarLayerProps) {
  const map = useMap();
  const layersRef = useRef<Map<number, L.TileLayer>>(new Map());
  const activeIndexRef = useRef<number>(-1);

  useEffect(() => {
    frames.forEach((frame, i) => {
      if (!layersRef.current.has(i)) {
        const url = `${host}${frame.path}/256/{z}/{x}/{y}/${COLOR}/1_1.png`;
        const layer = L.tileLayer(url, { opacity: 0, zIndex: 200 });
        layer.addTo(map);
        layersRef.current.set(i, layer);
      }
    });
    return () => {
      layersRef.current.forEach(l => l.remove());
      layersRef.current.clear();
    };
  }, [map, host, frames]);

  useEffect(() => {
    const prev = layersRef.current.get(activeIndexRef.current);
    if (prev) prev.setOpacity(0);
    const next = layersRef.current.get(frameIndex);
    if (next) next.setOpacity(OPACITY);
    activeIndexRef.current = frameIndex;
  }, [frameIndex]);

  return null;
}

interface Props {
  host: string;
  frames: RadarFrame[];
  pastCount: number;
}

export default function RadarMap({ host, frames, pastCount }: Props) {
  // Start at the latest past frame (last observed, before any forecast)
  const [frameIndex, setFrameIndex] = useState(pastCount - 1);
  const [playing, setPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFrameIndex(i => (i + 1) % frames.length);
    }, 600);
  }, [frames.length]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (playing) startLoop();
    else stopLoop();
    return stopLoop;
  }, [playing, startLoop, stopLoop]);

  const frame = frames[frameIndex];
  const isForecast = frame?.isForecast ?? false;
  const timestamp = frame
    ? new Date(frame.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  const hasForecast = frames.length > pastCount;

  // Gradient background on the slider: grey for past, blue for forecast
  const pastPct = frames.length > 1 ? ((pastCount - 1) / (frames.length - 1)) * 100 : 100;
  const sliderBg = hasForecast
    ? `linear-gradient(to right, #555 0%, #555 ${pastPct}%, #60a5fa ${pastPct}%, #60a5fa 100%)`
    : undefined;

  return (
    <div className="radar-wrapper">
      <MapContainer
        center={[LAT, LON]}
        zoom={7}
        className="radar-map"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          maxZoom={19}
        />
        <RadarLayer host={host} frames={frames} frameIndex={frameIndex} />
        <Marker position={[LAT, LON]}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            📍 42.07°N 86.51°W
          </Tooltip>
        </Marker>
      </MapContainer>

      <div className="radar-controls">
        <button
          className="radar-controls__btn"
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="radar-controls__slider-wrap">
          {hasForecast && (
            <div className="radar-controls__track-labels">
              <span>Past</span>
              <span style={{ marginLeft: `${pastPct}%` }}>Forecast</span>
            </div>
          )}
          <input
            type="range"
            className="radar-controls__slider"
            style={sliderBg ? { background: sliderBg } : undefined}
            min={0}
            max={frames.length - 1}
            value={frameIndex}
            onChange={e => {
              setPlaying(false);
              setFrameIndex(Number(e.target.value));
            }}
          />
        </div>

        <span className={`radar-controls__time ${isForecast ? 'radar-controls__time--forecast' : ''}`}>
          {isForecast && <span className="radar-controls__badge">FCST</span>}
          {timestamp}
        </span>

        <span className="radar-controls__source">
          <a href="https://rainviewer.com" target="_blank" rel="noopener noreferrer">RainViewer</a>
        </span>
      </div>

      {!hasForecast && (
        <p className="radar-no-forecast">
          Nowcast unavailable — showing observed radar only. Forecast frames appear when RainViewer has sufficient data to generate them.
        </p>
      )}
    </div>
  );
}
