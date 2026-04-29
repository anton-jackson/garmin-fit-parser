import { parseRaw, buildStructured } from './parse.js';
import { annotateRecords, annotateLaps, annotateSession } from './derive.js';
import { binAllLaps } from './bin.js';
import { resolveProfile, profileFlags } from './sportProfile.js';
import { detectAscentSegments, gradeBucketHistogram } from './segments.js';

/**
 * Parse a FIT buffer and return a fully analyzed structure:
 *   { activity, session, laps[], records[], lapSeries[], profile, profileFlags }
 *
 * Each record carries lap_index, pace_s_per_km, grade_pct, grade_pct_smoothed,
 * gap_s_per_km, is_moving. Each lap carries derived totals plus drift /
 * decoupling computed from moving records only. The session block includes a
 * data-quality summary (moving_pct, gps_pct).
 *
 * The `profile` field names the sport profile (running / hiking / ski_touring
 * / alpine_skiing / cycling / default). Exporters use `profileFlags` to decide
 * which derived metrics make sense to surface.
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

  const profile = resolveProfile(
    session?.sport ?? structured.activity?.sport ?? null,
    session?.sub_sport ?? structured.activity?.sub_sport ?? null
  );
  const flags = profileFlags(profile);

  // Climbing metrics are always computed; markdown decides whether to render
  // them based on the activity's actual climbing volume, not sport.
  const ascentSegments = detectAscentSegments(records);
  const gradeBuckets = gradeBucketHistogram(records);

  return {
    activity: structured.activity,
    session,
    sessions: structured.sessions,
    laps,
    records,
    lapSeries,
    profile,
    profile_flags: flags,
    ascent_segments: ascentSegments,
    grade_buckets: gradeBuckets
  };
}

export { parseRaw, buildStructured } from './parse.js';
export { annotateRecords, annotateLaps, annotateSession, gradeAdjustPace } from './derive.js';
export { binLap, binAllLaps, defaultBinSeconds } from './bin.js';
export { resolveProfile, profileFlags } from './sportProfile.js';
export { detectAscentSegments, gradeBucketHistogram } from './segments.js';
