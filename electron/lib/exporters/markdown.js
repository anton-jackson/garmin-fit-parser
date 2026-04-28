import {
  secondsToHms,
  num,
  int,
  isoDate,
  distanceLabel,
  elevationLabel,
  formatDistance,
  formatElevation,
  formatPace,
  formatVertPerDistance,
  metersToElevation
} from './format.js';

function lapTimeStr(lap) {
  return secondsToHms(lap.total_elapsed_time ?? lap.total_timer_time);
}

function fileBaseName(filePath) {
  if (!filePath) return null;
  const name = filePath.split(/[\\/]/).pop();
  return name.replace(/\.fit$/i, '');
}

export function buildMarkdown(analysis, { selectedLapIndices, sourceFile, lapSeriesByIndex, units = 'imperial' }) {
  const { activity, session, laps } = analysis;
  const distUnit = distanceLabel(units);
  const elevUnit = elevationLabel(units);

  const sport = session?.sport ?? activity?.sport ?? 'activity';
  const startTime = session?.start_time ?? activity?.timestamp ?? laps[0]?.start_time;
  const title = `${sport} — ${isoDate(startTime) || fileBaseName(sourceFile) || 'untitled'}`;

  const sessionAscent = session?.total_ascent_m ?? session?.total_ascent;
  const sessionDescent = session?.total_descent_m ?? session?.total_descent;

  const summaryLines = [
    `**Duration:** ${secondsToHms(session?.total_elapsed_time ?? session?.total_timer_time)}`,
    `**Distance:** ${formatDistance(session?.total_distance, units)} ${distUnit}`,
    `**Elevation:** ↑${formatElevation(sessionAscent, units)} / ↓${formatElevation(sessionDescent, units)} ${elevUnit}`,
    `**Vertical:** ${formatVertPerDistance(session?.vertical_per_km_m, units)}`,
    `**Avg HR:** ${int(session?.avg_heart_rate)} bpm` +
      (session?.max_heart_rate ? ` (max ${int(session.max_heart_rate)})` : ''),
    `**Avg pace:** ${formatPace(session?.avg_pace_s_per_km, units)}`
  ];
  if (session?.avg_power) summaryLines.push(`**Avg power:** ${int(session.avg_power)} W`);
  if (session?.training_stress_score) summaryLines.push(`**TSS:** ${num(session.training_stress_score, 0)}`);

  const lapsToShow = laps.filter((l) => selectedLapIndices.has(l.lap_index));

  const lapTable = [
    `| # | Type | Time | Dist (${distUnit}) | Pace | Avg HR | Max HR | Vert↑ (${elevUnit}) | Vert↓ (${elevUnit}) | Grade | HR drift | Pa:HR drift |`,
    '|---|------|------|------|------|--------|--------|-------|-------|-------|----------|-------------|',
    ...lapsToShow.map((l) =>
      `| ${l.lap_index + 1} | ${l.intensity ?? 'active'} | ${lapTimeStr(l)} | ${formatDistance(l.total_distance, units)} | ${formatPace(l.avg_pace_s_per_km, units)} | ${int(l.avg_heart_rate)} | ${int(l.max_heart_rate)} | ${formatElevation(l.total_ascent_m, units)} | ${formatElevation(l.total_descent_m, units)} | ${num(l.avg_grade_pct, 1)}% | ${num(l.hr_drift_pct, 1)}% | ${num(l.pa_hr_decoupling_pct, 1)}% |`
    )
  ].join('\n');

  const lapDetailSections = lapsToShow.map((l) => {
    const series = lapSeriesByIndex.get(l.lap_index);
    const binSize = series?.bin_size;
    const binUnit = series?.bin_unit;
    const intensityLine = `**Type:** ${l.intensity ?? 'active'}` +
      (l.lap_trigger ? ` (${l.lap_trigger})` : '');
    const driftLine = l.too_short_for_derived
      ? '_HR drift / Pa:HR decoupling skipped — lap too short for reliable derivation._'
      : `**HR drift:** ${num(l.hr_drift_pct, 1)}% · **Pa:HR decoupling:** ${num(l.pa_hr_decoupling_pct, 1)}%`;
    const headerBits = [
      intensityLine,
      `**Lap time:** ${lapTimeStr(l)}`,
      `**Distance:** ${formatDistance(l.total_distance, units)} ${distUnit}`,
      `**Avg HR:** ${int(l.avg_heart_rate)} (max ${int(l.max_heart_rate)})`,
      `**Avg pace:** ${formatPace(l.avg_pace_s_per_km, units)}`,
      `**Vert:** ↑${formatElevation(l.total_ascent_m, units)} ↓${formatElevation(l.total_descent_m, units)} ${elevUnit} (${num(l.avg_grade_pct, 1)}%)`,
      driftLine
    ].join('  \n');

    if (!series || series.series.length === 0) {
      return `### Lap ${l.lap_index + 1}\n${headerBits}\n\n_No binned series available._`;
    }

    const tableHead =
      binUnit === 'meters'
        ? `| Dist (${elevUnit === 'ft' ? 'mi' : 'm'}) | Pace | HR | Grade | GAP | Power |`
        : `| t | Pace | HR | Grade | GAP | Power |`;
    const tableSep = `|---|------|----|-------|-----|-------|`;
    const rows = series.series.map((b) => {
      const tCell =
        binUnit === 'meters'
          ? formatDistance(b.cumulative_distance_m, units, 2)
          : secondsToHms(b.t_offset_s);
      return `| ${tCell} | ${formatPace(b.avg_pace_s_per_km, units)} | ${int(b.avg_hr)} | ${num(b.grade_pct, 1)}% | ${formatPace(b.gap_s_per_km, units)} | ${int(b.avg_power)} |`;
    });

    return [
      `### Lap ${l.lap_index + 1}`,
      headerBits,
      '',
      `_Binned every ${binSize} ${binUnit}._`,
      '',
      tableHead,
      tableSep,
      ...rows
    ].join('\n');
  });

  return [
    `# ${title}`,
    '',
    summaryLines.join('  \n'),
    '',
    '## Laps',
    '',
    lapTable,
    '',
    '## Lap detail',
    '',
    lapDetailSections.join('\n\n')
  ].join('\n');
}
