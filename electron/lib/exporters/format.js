// Shared formatting helpers used by exporters.

const M_PER_MILE = 1609.344;
const M_PER_FT = 0.3048;

export function secondsToHms(sec) {
  if (sec == null || !Number.isFinite(sec)) return '';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function num(v, dp = 1) {
  if (v == null || !Number.isFinite(v)) return '';
  return v.toFixed(dp);
}

export function int(v) {
  if (v == null || !Number.isFinite(v)) return '';
  return String(Math.round(v));
}

export function isoDate(d) {
  if (d == null) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().replace('T', ' ').slice(0, 16);
}

// ----- units-aware ----- //

export function distanceLabel(units) {
  return units === 'imperial' ? 'mi' : 'km';
}
export function elevationLabel(units) {
  return units === 'imperial' ? 'ft' : 'm';
}
export function paceLabel(units) {
  return units === 'imperial' ? '/mi' : '/km';
}

export function metersToDistance(m, units) {
  if (m == null || !Number.isFinite(m)) return null;
  return units === 'imperial' ? m / M_PER_MILE : m / 1000;
}
export function metersToElevation(m, units) {
  if (m == null || !Number.isFinite(m)) return null;
  return units === 'imperial' ? m / M_PER_FT : m;
}
export function paceSPerUnit(sPerKm, units) {
  if (sPerKm == null || !Number.isFinite(sPerKm)) return null;
  return units === 'imperial' ? sPerKm * (M_PER_MILE / 1000) : sPerKm;
}

export function formatDistance(meters, units, dp = 2) {
  const v = metersToDistance(meters, units);
  return v == null ? '' : v.toFixed(dp);
}
export function formatElevation(meters, units) {
  const v = metersToElevation(meters, units);
  return v == null ? '' : String(Math.round(v));
}
export function formatPace(sPerKm, units) {
  const sPerUnit = paceSPerUnit(sPerKm, units);
  if (sPerUnit == null || sPerUnit <= 0) return '';
  let m = Math.floor(sPerUnit / 60);
  let s = Math.round(sPerUnit % 60);
  if (s === 60) { s = 0; m += 1; }
  return `${m}:${String(s).padStart(2, '0')}${paceLabel(units)}`;
}
export function formatVertPerDistance(verticalPerKmM, units) {
  if (verticalPerKmM == null || !Number.isFinite(verticalPerKmM)) return '';
  if (units === 'imperial') {
    return `${Math.round((verticalPerKmM * M_PER_MILE / 1000) / M_PER_FT)} ft/mi`;
  }
  return `${Math.round(verticalPerKmM)} m/km`;
}

// VAM (vertical ascent metric): meters of climbing per hour of moving time.
// Render as ft/h or m/h depending on units.
export function formatVAM(mPerHour, units) {
  if (mPerHour == null || !Number.isFinite(mPerHour)) return '';
  if (units === 'imperial') return `${Math.round(mPerHour / M_PER_FT)} ft/h`;
  return `${Math.round(mPerHour)} m/h`;
}
