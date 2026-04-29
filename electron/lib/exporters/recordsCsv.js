import Papa from 'papaparse';
import { metersToDistance, metersToElevation, paceSPerUnit } from './format.js';

const COMMON_BASE = [
  'timestamp',
  'lap_index',
  'distance',
  'speed',
  'pace',
  'heart_rate',
  'power',
  'cadence',
  'altitude',
  'position_lat',
  'position_long',
  'temperature'
];
const GRADE_BASE = ['grade_pct', 'grade_pct_smoothed', 'gap'];

const M_PER_MILE = 1609.344;

function suffix(units) {
  return {
    distance: units === 'imperial' ? 'mi' : 'm',
    altitude: units === 'imperial' ? 'ft' : 'm',
    speed: units === 'imperial' ? 'mph' : 'm_per_s',
    pace: units === 'imperial' ? 's_per_mi' : 's_per_km'
  };
}

function pickValue(record, baseKey, units) {
  switch (baseKey) {
    case 'timestamp': {
      const v = record.timestamp;
      return v instanceof Date ? v.toISOString() : v ?? '';
    }
    case 'lap_index':
      return record.lap_index ?? '';
    case 'distance': {
      const m = record.distance;
      const v = metersToDistance(m, units);
      return v == null ? '' : Number(v.toFixed(4));
    }
    case 'speed': {
      const ms = record.enhanced_speed ?? record.speed;
      if (ms == null) return '';
      return units === 'imperial' ? Number((ms * 3600 / M_PER_MILE).toFixed(3)) : Number(ms.toFixed(3));
    }
    case 'pace': {
      const v = paceSPerUnit(record.pace_s_per_km, units);
      return v == null ? '' : Number(v.toFixed(2));
    }
    case 'altitude': {
      const m = record.enhanced_altitude ?? record.altitude;
      const v = metersToElevation(m, units);
      return v == null ? '' : Number(v.toFixed(2));
    }
    case 'gap': {
      const v = paceSPerUnit(record.gap_s_per_km, units);
      return v == null ? '' : Number(v.toFixed(2));
    }
    default: {
      const v = record[baseKey];
      if (v == null) return '';
      if (v instanceof Date) return v.toISOString();
      return v;
    }
  }
}

function colName(baseKey, units) {
  const sx = suffix(units);
  switch (baseKey) {
    case 'distance': return `distance_${sx.distance}`;
    case 'altitude': return `altitude_${sx.altitude}`;
    case 'speed': return `speed_${sx.speed}`;
    case 'pace': return `pace_${sx.pace}`;
    case 'gap': return `gap_${sx.pace}`;
    default: return baseKey;
  }
}

export function buildRecordsCsv(analysis, { selectedLapIndices, includeGrade = false, units = 'metric' }) {
  const records = analysis.records.filter((r) => selectedLapIndices.has(r.lap_index));

  const baseCols = [...COMMON_BASE];
  if (includeGrade) baseCols.push(...GRADE_BASE);

  // Drop columns that are entirely absent from the source data.
  const keptBase = baseCols.filter((b) => {
    if (b === 'lap_index') return true;
    if (b === 'speed') return records.some((r) => (r.enhanced_speed ?? r.speed) != null);
    if (b === 'altitude') return records.some((r) => (r.enhanced_altitude ?? r.altitude) != null);
    if (b === 'pace') return records.some((r) => r.pace_s_per_km != null);
    if (b === 'gap') return records.some((r) => r.gap_s_per_km != null);
    return records.some((r) => r[b] != null);
  });

  const cols = keptBase.map((b) => colName(b, units));
  const rows = records.map((r) => {
    const out = {};
    for (const b of keptBase) out[colName(b, units)] = pickValue(r, b, units);
    return out;
  });

  return Papa.unparse(rows, { header: true, columns: cols, delimiter: ',', newline: '\n' });
}
