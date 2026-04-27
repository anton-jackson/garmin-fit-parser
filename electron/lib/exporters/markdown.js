import { secondsToHms, paceToStr, num, int, km, isoDate } from './format.js';

function lapTimeStr(lap) {
  return secondsToHms(lap.total_elapsed_time ?? lap.total_timer_time);
}

function fileBaseName(filePath) {
  if (!filePath) return null;
  const name = filePath.split(/[\\/]/).pop();
  return name.replace(/\.fit$/i, '');
}

export function buildMarkdown(analysis, { selectedLapIndices, sourceFile, lapSeriesByIndex }) {
  const { activity, session, laps } = analysis;

  const sport = session?.sport ?? activity?.sport ?? 'activity';
  const startTime = session?.start_time ?? activity?.timestamp ?? laps[0]?.start_time;
  const title = `${sport} — ${isoDate(startTime) || fileBaseName(sourceFile) || 'untitled'}`;

  const summaryLines = [
    `**Duration:** ${secondsToHms(session?.total_elapsed_time ?? session?.total_timer_time)}`,
    `**Distance:** ${km(session?.total_distance)} km`,
    `**Elevation:** ↑${int(session?.total_ascent_m ?? session?.total_ascent)} m / ↓${int(session?.total_descent_m ?? session?.total_descent)} m`,
    `**Vertical/km:** ${num(session?.vertical_per_km_m, 1)} m`,
    `**Avg HR:** ${int(session?.avg_heart_rate)} bpm` +
      (session?.max_heart_rate ? ` (max ${int(session.max_heart_rate)})` : ''),
    `**Avg pace:** ${paceToStr(session?.avg_pace_s_per_km)}`
  ];
  if (session?.avg_power) summaryLines.push(`**Avg power:** ${int(session.avg_power)} W`);
  if (session?.training_stress_score) summaryLines.push(`**TSS:** ${num(session.training_stress_score, 0)}`);

  const lapsToShow = laps.filter((l) => selectedLapIndices.has(l.lap_index));

  const lapTable = [
    '| # | Time | Dist (km) | Pace | GAP | Avg HR | Max HR | Vert↑ | Vert↓ | Grade | HR drift | Pa:HR drift |',
    '|---|------|-----------|------|-----|--------|--------|-------|-------|-------|----------|-------------|',
    ...lapsToShow.map((l) => {
      const gap =
        l.avg_grade_pct != null && l.avg_pace_s_per_km != null
          ? null // GAP at lap level requires the bin-weighted approach; leave blank for now
          : null;
      return `| ${l.lap_index + 1} | ${lapTimeStr(l)} | ${km(l.total_distance)} | ${paceToStr(l.avg_pace_s_per_km)} | ${gap == null ? '' : paceToStr(gap)} | ${int(l.avg_heart_rate)} | ${int(l.max_heart_rate)} | ${int(l.total_ascent_m)} | ${int(l.total_descent_m)} | ${num(l.avg_grade_pct, 1)}% | ${num(l.hr_drift_pct, 1)}% | ${num(l.pa_hr_decoupling_pct, 1)}% |`;
    })
  ].join('\n');

  const lapDetailSections = lapsToShow.map((l) => {
    const series = lapSeriesByIndex.get(l.lap_index);
    const binSize = series?.bin_size;
    const binUnit = series?.bin_unit;
    const headerBits = [
      `**Lap time:** ${lapTimeStr(l)}`,
      `**Distance:** ${km(l.total_distance)} km`,
      `**Avg HR:** ${int(l.avg_heart_rate)} (max ${int(l.max_heart_rate)})`,
      `**Avg pace:** ${paceToStr(l.avg_pace_s_per_km)}`,
      `**Vert:** ↑${int(l.total_ascent_m)} ↓${int(l.total_descent_m)} m (${num(l.avg_grade_pct, 1)}%)`,
      `**HR drift:** ${num(l.hr_drift_pct, 1)}% · **Pa:HR decoupling:** ${num(l.pa_hr_decoupling_pct, 1)}%`
    ].join('  \n');

    if (!series || series.series.length === 0) {
      return `### Lap ${l.lap_index + 1}\n${headerBits}\n\n_No binned series available._`;
    }

    const tableHead =
      binUnit === 'meters'
        ? `| Dist (m) | Pace | HR | Grade | GAP | Power |`
        : `| t | Pace | HR | Grade | GAP | Power |`;
    const tableSep = `|---|------|----|-------|-----|-------|`;
    const rows = series.series.map((b) => {
      const tCell =
        binUnit === 'meters'
          ? int(b.cumulative_distance_m)
          : secondsToHms(b.t_offset_s);
      return `| ${tCell} | ${paceToStr(b.avg_pace_s_per_km)} | ${int(b.avg_hr)} | ${num(b.grade_pct, 1)}% | ${paceToStr(b.gap_s_per_km)} | ${int(b.avg_power)} |`;
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
