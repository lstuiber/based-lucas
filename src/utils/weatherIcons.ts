// Maps NWS icon URLs like .../icons/land/day/skc?size=... to an emoji
export function getWeatherEmoji(iconUrl: string, isDaytime: boolean): string {
  const match = iconUrl.match(/\/icons\/land\/(day|night)\/([^?/,]+)/);
  if (!match) return isDaytime ? '🌤️' : '🌙';

  const cond = match[2].toLowerCase();
  const day = match[1] === 'day';

  if (cond.includes('tsra') || cond.includes('thunderstorm')) return '⛈️';
  if (cond === 'fzra' || cond.includes('freezing')) return '🌨️';
  if (cond.startsWith('sn') || cond.includes('snow') || cond.includes('blizzard')) return '❄️';
  if (cond.includes('sleet') || cond.includes('ip')) return '🌨️';
  if (cond.includes('rain_showers') || cond.includes('showers')) return '🌦️';
  if (cond.startsWith('ra') || cond.includes('rain')) return '🌧️';
  if (cond.includes('fog') || cond.startsWith('fg')) return '🌫️';
  if (cond.includes('wind') || cond.includes('gale')) return '💨';
  if (cond.startsWith('ovc')) return '☁️';
  if (cond.startsWith('bkn')) return day ? '🌥️' : '☁️';
  if (cond.startsWith('sct')) return '⛅';
  if (cond.startsWith('few')) return day ? '🌤️' : '🌙';
  if (cond.startsWith('skc') || cond.startsWith('clr')) return day ? '☀️' : '🌙';

  return isDaytime ? '🌤️' : '🌙';
}

export function formatHour(isoTime: string): string {
  const date = new Date(isoTime);
  const now = new Date();
  const diffMin = Math.abs(date.getTime() - now.getTime()) / 60000;
  if (diffMin < 30) return 'Now';
  return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}
