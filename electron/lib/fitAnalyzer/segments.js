// Ascent segment auto-detection and grade-bucket histogram.
// Used by hiking / cycling / ski_touring profiles where the dominant
// question is "how did the climb go" rather than per-lap pace.

import { toMs } from './parse.js';

const REVERSE_THRESHOLD_M = 15;   // 50 ft — ignore minor dips inside a climb
const MIN_SEGMENT_GAIN_M = 60;    // 200 ft — minimum to count as a "climb"

function altOf(rec) {
  return rec.enhanced_altitude ?? rec.altitude ?? null;
}
function hrOf(rec) {
  return rec.heart_rate ?? null;
}
function avg(xs) {
  const ys = xs.filter((x) => x != null && Number.isFinite(x));
  if (ys.length === 0) return null;
  return ys.reduce((a, b) => a + b, 0) / ys.length;
}

/**
 * Walk records and emit ascent segments. A segment starts at the lowest
 * point of an ongoing climb and ends at the peak. Descents > 50 ft from
 * peak terminate the segment; resulting climb is kept only if total gain
 * ≥ 200 ft.
 */
export function detectAscentSegments(records) {
  const segs = [];
  let startIdx = null;
  let minAlt = null;
  let maxAlt = null;
  let maxIdx = null;

  for (let i = 0; i < records.length; i++) {
    const a = altOf(records[i]);
    if (a == null) continue;

    if (startIdx == null) {
      startIdx = i; minAlt = a; maxAlt = a; maxIdx = i;
      continue;
    }

    if (a > maxAlt) { maxAlt = a; maxIdx = i; }
    if (a < minAlt) {
      // base lowered before peak reached — restart from here
      startIdx = i; minAlt = a; maxAlt = a; maxIdx = i;
      continue;
    }

    if ((maxAlt - a) >= REVERSE_THRESHOLD_M) {
      const gain = maxAlt - minAlt;
      if (gain >= MIN_SEGMENT_GAIN_M) {
        segs.push({ startIdx, peakIdx: maxIdx, gain });
      }
      startIdx = i; minAlt = a; maxAlt = a; maxIdx = i;
    }
  }
  if (startIdx != null && maxAlt - minAlt >= MIN_SEGMENT_GAIN_M) {
    segs.push({ startIdx, peakIdx: maxIdx, gain: maxAlt - minAlt });
  }

  return segs.map((s, n) => summarizeSegment(s, records, n));
}

function summarizeSegment({ startIdx, peakIdx, gain }, records, n) {
  const slice = records.slice(startIdx, peakIdx + 1);
  const moving = slice.filter((r) => r.is_moving);

  const startTs = toMs(records[startIdx].timestamp);
  const peakTs = toMs(records[peakIdx].timestamp);
  const elapsedSec = startTs != null && peakTs != null ? (peakTs - startTs) / 1000 : null;
  // Approximate moving time from moving record count (records are ~1 Hz).
  const movingSec = moving.length;

  const distStart = records[startIdx].distance ?? null;
  const distEnd = records[peakIdx].distance ?? null;
  const distM = distStart != null && distEnd != null ? distEnd - distStart : null;

  const vamMPerH =
    movingSec > 0 ? gain / (movingSec / 3600) : null;

  return {
    segment_index: n,
    start_time: records[startIdx].timestamp,
    peak_time: records[peakIdx].timestamp,
    elapsed_s: elapsedSec,
    moving_s: movingSec || null,
    ascent_m: gain,
    distance_m: distM,
    avg_grade_pct: distM && distM > 0 ? (gain / distM) * 100 : null,
    avg_hr: avg(moving.map(hrOf)),
    max_hr: Math.max(...slice.map(hrOf).filter((x) => x != null), -Infinity) || null,
    vam_m_per_h: vamMPerH
  };
}

// ----- grade buckets ----- //

const GRADE_BUCKETS = [
  { key: '<-25',     min: -Infinity, max: -25 },
  { key: '-25..-15', min: -25,       max: -15 },
  { key: '-15..-5',  min: -15,       max: -5  },
  { key: '-5..5',    min: -5,        max: 5   },
  { key: '5..15',    min: 5,         max: 15  },
  { key: '15..25',   min: 15,        max: 25  },
  { key: '25..35',   min: 25,        max: 35  },
  { key: '>35',      min: 35,        max: Infinity }
];

/**
 * Bucket moving records by smoothed grade and report time / avg HR per band.
 * Time is approximated as the count of records in the bucket (records ~1 Hz).
 */
export function gradeBucketHistogram(records) {
  const moving = records.filter((r) => r.is_moving);
  return GRADE_BUCKETS.map((b) => {
    const inBucket = moving.filter((r) => {
      const g = r.grade_pct_smoothed;
      if (g == null) return false;
      return g >= b.min && g < b.max;
    });
    return {
      grade_band: b.key,
      time_s: inBucket.length || null,
      avg_hr: avg(inBucket.map(hrOf)),
      record_count: inBucket.length
    };
  });
}
