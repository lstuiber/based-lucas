import { useRadar } from '../hooks/useRadar';
import RadarMap from '../components/RadarMap';

export default function Weather() {
  const { data, loading, error } = useRadar();

  if (loading) {
    return <div className="radar-placeholder">Loading radar…</div>;
  }

  if (error || !data) {
    return <div className="radar-placeholder radar-placeholder--error">{error ?? 'No radar data'}</div>;
  }

  return (
    <div className="weather-page">
      <RadarMap host={data.host} frames={data.frames} pastCount={data.pastCount} />
    </div>
  );
}
