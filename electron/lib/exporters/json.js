// JSON exporter for downstream LLM/agent consumption.
//
// Default shape excludes the raw 1Hz records array (token-heavy). Pass
// includeRecords: true to embed them.

export function buildJSON(analysis, { selectedLapIndices, includeRecords = false, lapSeriesByIndex, units = 'metric' }) {
  const { activity, session, laps } = analysis;

  const lapsOut = laps
    .filter((l) => selectedLapIndices.has(l.lap_index))
    .map((l) => ({
      lap_index: l.lap_index,
      start_time: l.start_time,
      total_elapsed_time: l.total_elapsed_time ?? l.total_timer_time ?? null,
      total_distance: l.total_distance ?? null,
      avg_heart_rate: l.avg_heart_rate ?? null,
      max_heart_rate: l.max_heart_rate ?? null,
      avg_speed: l.avg_speed ?? null,
      avg_pace_s_per_km: l.avg_pace_s_per_km ?? null,
      avg_power: l.avg_power ?? null,
      normalized_power: l.normalized_power ?? null,
      avg_cadence: l.avg_cadence ?? null,
      total_ascent_m: l.total_ascent_m ?? null,
      total_descent_m: l.total_descent_m ?? null,
      vertical_per_km_m: l.vertical_per_km_m ?? null,
      avg_grade_pct: l.avg_grade_pct ?? null,
      hr_drift_pct: l.hr_drift_pct ?? null,
      pa_hr_decoupling_pct: l.pa_hr_decoupling_pct ?? null,
      efficiency_factor_first_half: l.efficiency_factor_first_half ?? null,
      efficiency_factor_second_half: l.efficiency_factor_second_half ?? null,
      series: lapSeriesByIndex.get(l.lap_index) ?? null
    }));

  const out = {
    units: {
      // Underlying numeric values are always SI (meters, m/s, seconds-per-km).
      // The `display` field hints which units the markdown was rendered in.
      values: 'SI',
      display: units,
      distance: 'meters',
      speed: 'meters_per_second',
      pace: 'seconds_per_km',
      elevation: 'meters'
    },
    activity: {
      sport: session?.sport ?? activity?.sport ?? null,
      sub_sport: session?.sub_sport ?? null,
      start_time: session?.start_time ?? activity?.timestamp ?? null
    },
    session: session
      ? {
          start_time: session.start_time ?? null,
          total_elapsed_time: session.total_elapsed_time ?? null,
          total_timer_time: session.total_timer_time ?? null,
          total_distance: session.total_distance ?? null,
          avg_heart_rate: session.avg_heart_rate ?? null,
          max_heart_rate: session.max_heart_rate ?? null,
          avg_speed: session.avg_speed ?? null,
          avg_pace_s_per_km: session.avg_pace_s_per_km ?? null,
          avg_power: session.avg_power ?? null,
          normalized_power: session.normalized_power ?? null,
          total_ascent_m: session.total_ascent_m ?? null,
          total_descent_m: session.total_descent_m ?? null,
          vertical_per_km_m: session.vertical_per_km_m ?? null,
          training_stress_score: session.training_stress_score ?? null,
          total_calories: session.total_calories ?? null
        }
      : null,
    laps: lapsOut
  };

  if (includeRecords) {
    out.records = analysis.records.filter((r) => selectedLapIndices.has(r.lap_index));
  }

  return JSON.stringify(out, null, 2);
}
