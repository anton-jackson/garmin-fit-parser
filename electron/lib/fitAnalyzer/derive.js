import { toMs } from './parse.js';

const MINETTI_FLAT_COST = 3.6;

// Minetti (2002) energy cost of running on a gradient (J/kg/m). g is decimal grade.
function minettiCost(g) {
  const g2 = g * g;
  const g3 = g2 * g;
  const g4 = g3 * g;
  const g5 = g4 * g;
  return 155.4 * g5 - 30.4 * g4 - 43.3 * g3 + 46.3 * g2 + 19.5 * g + 3.6;
}

// Grade-adjusted pace: equivalent flat pace (s/km) for the same metabolic cost.
// gap = pace * (cost_flat / cost_grade)
export function gradeAdjustPace(paceSPerKm, gradeDecimal) {
  if (paceSPerKm == null || !Number.isFinite(paceSPerKm)) return null;
  if (gradeDecimal == null || !Number.isFinite(gradeDecimal)) return paceSPerKm;
  const c = minettiCost(gradeDecimal);
  if (c <= 0) return null;
  return paceSPerKm * (MINETTI_FLAT_COST / c);
}

function speedField(rec) {
  return rec.enhanced_speed ?? rec.speed ?? null;
}
function altField(rec) {
  return rec.enhanced_altitude ?? rec.altitude ?? null;
}
function distField(rec) {
  return rec.distance ?? null;
}

export function paceSPerKmFromSpeed(speedMs) {
  if (speedMs == null || speedMs <= 0) return null;
  return 1000 / speedMs;
}

// Compute per-record grade (smoothed) and pace/GAP.
// Smoothing: symmetric window of ±halfWindowSec on timestamps; grade derived
// from cumulative altitude/distance deltas across the window endpoints.
export function annotateRecords(records, { halfWindowSec = 15 } = {}) {
  const n = records.length;
  if (n === 0) return records;

  const ts = new Array(n);
  const dist = new Array(n);
  const alt = new Array(n);
  for (let i = 0; i < n; i++) {
    ts[i] = toMs(records[i].timestamp);
    dist[i] = distField(records[i]);
    alt[i] = altField(records[i]);
  }

  let lo = 0;
  let hi = 0;
  const halfMs = halfWindowSec * 1000;

  return records.map((rec, i) => {
    const t = ts[i];
    const speed = speedField(rec);
    const pace = paceSPerKmFromSpeed(speed);

    let gradeRaw = null;
    let gradeSmoothed = null;

    if (i > 0 && dist[i] != null && dist[i - 1] != null && alt[i] != null && alt[i - 1] != null) {
      const dd = dist[i] - dist[i - 1];
      if (dd > 0.1) gradeRaw = (alt[i] - alt[i - 1]) / dd;
    }

    if (t != null && halfWindowSec > 0) {
      while (lo < n && ts[lo] != null && ts[lo] < t - halfMs) lo++;
      while (hi < n - 1 && ts[hi + 1] != null && ts[hi + 1] <= t + halfMs) hi++;
      if (
        lo < hi &&
        dist[lo] != null && dist[hi] != null &&
        alt[lo] != null && alt[hi] != null
      ) {
        const dd = dist[hi] - dist[lo];
        if (dd > 1) gradeSmoothed = (alt[hi] - alt[lo]) / dd;
      }
    }

    const gradeForGap = gradeSmoothed ?? gradeRaw;
    const gap = pace != null && gradeForGap != null ? gradeAdjustPace(pace, gradeForGap) : pace;

    return {
      ...rec,
      pace_s_per_km: pace,
      grade_pct: gradeRaw != null ? gradeRaw * 100 : null,
      grade_pct_smoothed: gradeSmoothed != null ? gradeSmoothed * 100 : null,
      gap_s_per_km: gap
    };
  });
}

function avg(nums) {
  const xs = nums.filter((x) => x != null && Number.isFinite(x));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sumPositive(deltas) {
  let s = 0;
  for (const d of deltas) if (d != null && d > 0) s += d;
  return s;
}
function sumNegative(deltas) {
  let s = 0;
  for (const d of deltas) if (d != null && d < 0) s -= d;
  return s;
}

function deriveLapMetrics(lap, lapRecords) {
  const distM = lap.total_distance ?? null;
  const elapsedSec = lap.total_elapsed_time ?? lap.total_timer_time ?? null;

  const avgSpeed =
    lap.avg_speed ??
    lap.enhanced_avg_speed ??
    (distM != null && elapsedSec ? distM / elapsedSec : null);
  const avgPace = paceSPerKmFromSpeed(avgSpeed);

  // Ascent/descent: prefer FIT-provided, else compute from records' altitude deltas
  let ascent = lap.total_ascent ?? null;
  let descent = lap.total_descent ?? null;
  if ((ascent == null || descent == null) && lapRecords.length > 1) {
    const deltas = [];
    for (let i = 1; i < lapRecords.length; i++) {
      const a0 = altField(lapRecords[i - 1]);
      const a1 = altField(lapRecords[i]);
      if (a0 != null && a1 != null) deltas.push(a1 - a0);
    }
    if (ascent == null) ascent = sumPositive(deltas);
    if (descent == null) descent = sumNegative(deltas);
  }

  const verticalPerKm = distM != null && distM > 0 && ascent != null ? (ascent / distM) * 1000 : null;
  const avgGradePct =
    distM != null && distM > 0 && ascent != null && descent != null
      ? ((ascent - descent) / distM) * 100
      : null;

  // Decoupling / drift over the lap, split into halves by record count
  let hrDriftPct = null;
  let paHrDecouplingPct = null;
  let efFirst = null;
  let efSecond = null;

  if (lapRecords.length >= 4) {
    const mid = Math.floor(lapRecords.length / 2);
    const first = lapRecords.slice(0, mid);
    const second = lapRecords.slice(mid);

    const hr1 = avg(first.map((r) => r.heart_rate));
    const hr2 = avg(second.map((r) => r.heart_rate));
    const sp1 = avg(first.map(speedField));
    const sp2 = avg(second.map(speedField));

    if (hr1 != null && hr2 != null && hr1 > 0) {
      hrDriftPct = ((hr2 - hr1) / hr1) * 100;
    }
    if (hr1 && hr2 && sp1 && sp2) {
      efFirst = sp1 / hr1;
      efSecond = sp2 / hr2;
      paHrDecouplingPct = ((efFirst - efSecond) / efFirst) * 100;
    }
  }

  return {
    avg_pace_s_per_km: avgPace,
    total_ascent_m: ascent,
    total_descent_m: descent,
    vertical_per_km_m: verticalPerKm,
    avg_grade_pct: avgGradePct,
    hr_drift_pct: hrDriftPct,
    pa_hr_decoupling_pct: paHrDecouplingPct,
    efficiency_factor_first_half: efFirst,
    efficiency_factor_second_half: efSecond
  };
}

export function annotateLaps(laps, records) {
  const byLap = new Map();
  for (const r of records) {
    const i = r.lap_index;
    if (i == null || i < 0) continue;
    if (!byLap.has(i)) byLap.set(i, []);
    byLap.get(i).push(r);
  }
  return laps.map((lap) => {
    const lapRecs = byLap.get(lap.lap_index) || [];
    return { ...lap, ...deriveLapMetrics(lap, lapRecs) };
  });
}

export function annotateSession(session, laps, records) {
  if (!session) return null;
  const distM = session.total_distance ?? null;
  const elapsedSec = session.total_elapsed_time ?? session.total_timer_time ?? null;
  const avgSpeed =
    session.avg_speed ??
    session.enhanced_avg_speed ??
    (distM != null && elapsedSec ? distM / elapsedSec : null);
  const avgPace = paceSPerKmFromSpeed(avgSpeed);

  let ascent = session.total_ascent ?? null;
  let descent = session.total_descent ?? null;
  if (ascent == null || descent == null) {
    const aSum = laps.reduce((s, l) => s + (l.total_ascent_m ?? 0), 0);
    const dSum = laps.reduce((s, l) => s + (l.total_descent_m ?? 0), 0);
    if (ascent == null) ascent = aSum || null;
    if (descent == null) descent = dSum || null;
  }
  const verticalPerKm = distM && ascent != null ? (ascent / distM) * 1000 : null;

  return {
    ...session,
    avg_pace_s_per_km: avgPace,
    total_ascent_m: ascent,
    total_descent_m: descent,
    vertical_per_km_m: verticalPerKm,
    record_count: records.length,
    lap_count: laps.length
  };
}
