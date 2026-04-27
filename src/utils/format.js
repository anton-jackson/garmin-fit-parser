export function secondsToHms(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function paceToStr(sPerKm) {
  if (sPerKm == null || !Number.isFinite(sPerKm) || sPerKm <= 0) return '—';
  const m = Math.floor(sPerKm / 60);
  const s = Math.round(sPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

export function num(v, dp = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(dp);
}

export function int(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  return String(Math.round(v));
}

export function km(meters) {
  if (meters == null || !Number.isFinite(meters)) return '—';
  return (meters / 1000).toFixed(2);
}

export function isoDate(d) {
  if (d == null) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toISOString().replace('T', ' ').slice(0, 16);
}
