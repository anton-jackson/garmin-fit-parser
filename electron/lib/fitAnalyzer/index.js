import { parseRaw, buildStructured } from './parse.js';
import { annotateRecords, annotateLaps, annotateSession } from './derive.js';
import { binAllLaps } from './bin.js';

/**
 * Parse a FIT buffer and return a fully analyzed structure:
 *   { activity, session, laps[], records[], lapSeries[] }
 *
 * Each record carries lap_index, pace_s_per_km, grade_pct, grade_pct_smoothed,
 * gap_s_per_km. Each lap carries derived totals (ascent/descent/grade, pace,
 * vertical/km) and decoupling/drift metrics. lapSeries contains per-lap binned
 * mini-series for HR-vs-pace-over-time analysis.
 *
 * @param {Buffer} buffer
 * @param {Object} opts
 * @param {number} [opts.smoothHalfWindowSec=15]   ±window for grade smoothing (30s total)
 * @param {'time'|'distance'} [opts.binMode='time']
 * @param {number|null} [opts.binSize=null]        seconds (time mode) or meters (distance); null = smart default
 */
export async function analyzeFITFile(buffer, opts = {}) {
  const {
    smoothHalfWindowSec = 15,
    binMode = 'time',
    binSize = null
  } = opts;

  const raw = await parseRaw(buffer);
  const structured = buildStructured(raw);

  const records = annotateRecords(structured.records, { halfWindowSec: smoothHalfWindowSec });
  const laps = annotateLaps(structured.laps, records);
  const session = annotateSession(structured.session, laps, records);
  const lapSeries = binAllLaps(laps, records, { mode: binMode, binSize });

  return {
    activity: structured.activity,
    session,
    sessions: structured.sessions,
    laps,
    records,
    lapSeries
  };
}

export { parseRaw, buildStructured } from './parse.js';
export { annotateRecords, annotateLaps, annotateSession, gradeAdjustPace } from './derive.js';
export { binLap, binAllLaps, defaultBinSeconds } from './bin.js';
