const M_PER_MILE = 1609.344;
const M_PER_FT = 0.3048;

export function secondsToHms(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function num(v, dp = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(dp);
}

export function int(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  return String(Math.round(v));
}

export function isoDate(d) {
  if (d == null) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toISOString().replace('T', ' ').slice(0, 16);
}

// ----- units-aware formatters ----- //

export function distanceLabel(units) {
  return units === 'imperial' ? 'mi' : 'km';
}
export function elevationLabel(units) {
  return units === 'imperial' ? 'ft' : 'm';
}
export function paceLabel(units) {
  return units === 'imperial' ? '/mi' : '/km';
}

export function formatDistance(meters, units, dp = 2) {
  if (meters == null || !Number.isFinite(meters)) return '—';
  if (units === 'imperial') return (meters / M_PER_MILE).toFixed(dp);
  return (meters / 1000).toFixed(dp);
}

export function formatElevation(meters, units) {
  if (meters == null || !Number.isFinite(meters)) return '—';
  if (units === 'imperial') return String(Math.round(meters / M_PER_FT));
  return String(Math.round(meters));
}

// pace input is seconds-per-km; converts to /mi when imperial.
export function formatPace(sPerKm, units) {
  if (sPerKm == null || !Number.isFinite(sPerKm) || sPerKm <= 0) return '—';
  const sPerUnit = units === 'imperial' ? sPerKm * (M_PER_MILE / 1000) : sPerKm;
  let m = Math.floor(sPerUnit / 60);
  let s = Math.round(sPerUnit % 60);
  if (s === 60) { s = 0; m += 1; }
  return `${m}:${String(s).padStart(2, '0')}${paceLabel(units)}`;
}

// vertical_per_km input value is meters per km; convert to ft/mi when imperial.
export function formatVertPerDistance(verticalPerKmMeters, units) {
  if (verticalPerKmMeters == null || !Number.isFinite(verticalPerKmMeters)) return '—';
  if (units === 'imperial') {
    const ftPerMi = verticalPerKmMeters * (M_PER_MILE / 1000) / M_PER_FT;
    return `${Math.round(ftPerMi)} ft/mi`;
  }
  return `${Math.round(verticalPerKmMeters)} m/km`;
}

// VAM: meters of climbing per hour of moving time. Render as ft/h or m/h.
export function formatVAM(mPerHour, units) {
  if (mPerHour == null || !Number.isFinite(mPerHour)) return '—';
  if (units === 'imperial') return `${Math.round(mPerHour / M_PER_FT)} ft/h`;
  return `${Math.round(mPerHour)} m/h`;
}
