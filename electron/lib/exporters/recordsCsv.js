import Papa from 'papaparse';

const COMMON_COLUMNS = [
  'timestamp',
  'lap_index',
  'distance',
  'enhanced_speed',
  'speed',
  'pace_s_per_km',
  'heart_rate',
  'power',
  'cadence',
  'enhanced_altitude',
  'altitude',
  'position_lat',
  'position_long',
  'temperature'
];
const GRADE_COLUMNS = ['grade_pct', 'grade_pct_smoothed', 'gap_s_per_km'];

export function buildRecordsCsv(analysis, { selectedLapIndices, includeGrade = false, columns = null }) {
  const records = analysis.records.filter((r) => selectedLapIndices.has(r.lap_index));

  let cols = columns;
  if (!cols) {
    cols = [...COMMON_COLUMNS];
    if (includeGrade) cols.push(...GRADE_COLUMNS);
    // drop columns that are entirely absent from the data to keep the CSV tidy
    cols = cols.filter((c) => records.some((r) => r[c] != null));
  }

  const rows = records.map((r) => {
    const out = {};
    for (const c of cols) {
      const v = r[c];
      if (v instanceof Date) out[c] = v.toISOString();
      else out[c] = v ?? '';
    }
    return out;
  });

  return Papa.unparse(rows, { header: true, columns: cols, delimiter: ',', newline: '\n' });
}
