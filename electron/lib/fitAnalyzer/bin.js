import { toMs } from './parse.js';
import { paceSPerKmFromSpeed, gradeAdjustPace } from './derive.js';

// Smart default bin size by lap duration (seconds).
export function defaultBinSeconds(lapDurationSec) {
  if (lapDurationSec == null) return 30;
  if (lapDurationSec < 5 * 60) return 10;
  if (lapDurationSec <= 20 * 60) return 30;
  return 60;
}

function avg(nums) {
  const xs = nums.filter((x) => x != null && Number.isFinite(x));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function speedField(r) {
  return r.enhanced_speed ?? r.speed ?? null;
}
function altField(r) {
  return r.enhanced_altitude ?? r.altitude ?? null;
}

function summarizeBin(bucket, lapStartMs, lapStartDist) {
  if (bucket.length === 0) return null;
  const first = bucket[0];
  const last = bucket[bucket.length - 1];
  const tStartMs = toMs(first.timestamp);
  const tEndMs = toMs(last.timestamp);
  const tOffsetSec =
    tStartMs != null && lapStartMs != null ? Math.round((tStartMs - lapStartMs) / 1000) : null;

  const speeds = bucket.map(speedField);
  const avgSpeed = avg(speeds);
  const avgPace = paceSPerKmFromSpeed(avgSpeed);

  const distStart = first.distance ?? null;
  const distEnd = last.distance ?? null;
  const distM =
    distStart != null && distEnd != null ? distEnd - distStart : null;

  const altStart = altField(first);
  const altEnd = altField(last);
  let gradePct = null;
  if (distM != null && distM > 1 && altStart != null && altEnd != null) {
    gradePct = ((altEnd - altStart) / distM) * 100;
  } else {
    gradePct = avg(bucket.map((r) => r.grade_pct_smoothed ?? r.grade_pct));
  }

  const gapPace =
    avgPace != null && gradePct != null
      ? gradeAdjustPace(avgPace, gradePct / 100)
      : avgPace;

  return {
    t_offset_s: tOffsetSec,
    duration_s:
      tStartMs != null && tEndMs != null ? Math.round((tEndMs - tStartMs) / 1000) : null,
    distance_m: distM,
    cumulative_distance_m:
      distEnd != null && lapStartDist != null ? distEnd - lapStartDist : null,
    avg_pace_s_per_km: avgPace,
    avg_hr: avg(bucket.map((r) => r.heart_rate)),
    avg_power: avg(bucket.map((r) => r.power)),
    avg_cadence: avg(bucket.map((r) => r.cadence ?? r.running_cadence)),
    grade_pct: gradePct,
    gap_s_per_km: gapPace
  };
}

// Bin a single lap's records by time (seconds) or distance (meters).
export function binLap(
  lap,
  records,
  { mode = 'time', binSize = null } = {}
) {
  const lapRecords = records.filter((r) => r.lap_index === lap.lap_index);
  if (lapRecords.length === 0) {
    return { lap_index: lap.lap_index, mode, bin_size: binSize, series: [] };
  }

  const lapStartMs = toMs(lap.start_time) ?? toMs(lapRecords[0].timestamp);
  const lapStartDist = lapRecords[0].distance ?? null;
  const lapDurationSec = lap.total_elapsed_time ?? lap.total_timer_time ?? null;

  let size = binSize;
  if (size == null) {
    size = mode === 'time' ? defaultBinSeconds(lapDurationSec) : 100;
  }

  const buckets = [];
  let current = [];

  if (mode === 'time') {
    const sizeMs = size * 1000;
    let bucketEnd = lapStartMs != null ? lapStartMs + sizeMs : null;
    for (const r of lapRecords) {
      const t = toMs(r.timestamp);
      if (t == null || bucketEnd == null) {
        current.push(r);
        continue;
      }
      while (t >= bucketEnd) {
        if (current.length) buckets.push(current);
        current = [];
        bucketEnd += sizeMs;
      }
      current.push(r);
    }
    if (current.length) buckets.push(current);
  } else {
    // distance mode
    let bucketEnd = lapStartDist != null ? lapStartDist + size : null;
    for (const r of lapRecords) {
      const d = r.distance;
      if (d == null || bucketEnd == null) {
        current.push(r);
        continue;
      }
      while (d >= bucketEnd) {
        if (current.length) buckets.push(current);
        current = [];
        bucketEnd += size;
      }
      current.push(r);
    }
    if (current.length) buckets.push(current);
  }

  const series = buckets
    .map((b) => summarizeBin(b, lapStartMs, lapStartDist))
    .filter((s) => s != null);

  return {
    lap_index: lap.lap_index,
    mode,
    bin_size: size,
    bin_unit: mode === 'time' ? 'seconds' : 'meters',
    series
  };
}

export function binAllLaps(laps, records, opts = {}) {
  return laps.map((lap) => binLap(lap, records, opts));
}
