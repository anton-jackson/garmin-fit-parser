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
  formatVertPerDistance
} from './format.js';

function lapTimeStr(lap) {
  return secondsToHms(lap.total_elapsed_time ?? lap.total_timer_time);
}

function fileBaseName(filePath) {
  if (!filePath) return null;
  const name = filePath.split(/[\\/]/).pop();
  return name.replace(/\.fit$/i, '');
}

// Format a percentage cell, leaving it blank rather than emitting a bare "%"
// when the underlying value is missing.
function pct(v, dp = 1) {
  if (v == null || !Number.isFinite(v)) return '';
  return `${v.toFixed(dp)}%`;
}

export function buildMarkdown(analysis, { selectedLapIndices, sourceFile, lapSeriesByIndex, units = 'imperial' }) {
  const { activity, session, laps, profile, profile_flags } = analysis;
  const flags = profile_flags ?? { drift: true, decoupling: true, gap: true, pace_primary: true };
  const distUnit = distanceLabel(units);
  const elevUnit = elevationLabel(units);

  const sport = session?.sport ?? activity?.sport ?? 'activity';
  const subSport = session?.sub_sport ?? activity?.sub_sport ?? null;
  const startTime = session?.start_time ?? activity?.timestamp ?? laps[0]?.start_time;
  const title = `${sport}${subSport ? ` (${subSport})` : ''} — ${isoDate(startTime) || fileBaseName(sourceFile) || 'untitled'}`;

  const sessionAscent = session?.total_ascent_m ?? session?.total_ascent;
  const sessionDescent = session?.total_descent_m ?? session?.total_descent;

  const summaryLines = [
    `**Profile:** ${profile ?? 'default'}`,
    `**Duration:** ${secondsToHms(session?.total_elapsed_time ?? session?.total_timer_time)}`,
    `**Distance:** ${formatDistance(session?.total_distance, units)} ${distUnit}`,
    `**Elevation:** ↑${formatElevation(sessionAscent, units)} / ↓${formatElevation(sessionDescent, units)} ${elevUnit}`,
    `**Vertical:** ${formatVertPerDistance(session?.vertical_per_km_m, units)}`,
    `**Avg HR:** ${int(session?.avg_heart_rate)} bpm` +
      (session?.max_heart_rate ? ` (max ${int(session.max_heart_rate)})` : '')
  ];
  if (flags.pace_primary) {
    summaryLines.push(`**Avg pace:** ${formatPace(session?.avg_pace_s_per_km, units)}`);
  }
  if (session?.avg_power) summaryLines.push(`**Avg power:** ${int(session.avg_power)} W`);
  if (session?.training_stress_score) summaryLines.push(`**TSS:** ${num(session.training_stress_score, 0)}`);

  const dataQualityLine =
    session?.moving_pct != null || session?.gps_pct != null
      ? `**Data quality:** ${pct(session?.moving_pct, 0)} moving · ${pct(session?.gps_pct, 0)} with GPS`
      : null;
  if (dataQualityLine) summaryLines.push(dataQualityLine);

  const lapsToShow = laps.filter((l) => selectedLapIndices.has(l.lap_index));

  // Column visibility driven by profile flags.
  const showPace = flags.pace_primary;
  const showDrift = flags.drift;
  const showDecoupling = flags.decoupling;

  const headerCols = ['#', 'Type', 'Time', `Dist (${distUnit})`];
  if (showPace) headerCols.push('Pace');
  headerCols.push('Avg HR', 'Max HR', `Vert↑ (${elevUnit})`, `Vert↓ (${elevUnit})`, 'Grade');
  if (showDrift) headerCols.push('HR drift');
  if (showDecoupling) headerCols.push('Pa:HR drift');

  const sep = headerCols.map(() => '---').join(' | ');

  const lapTable = [
    `| ${headerCols.join(' | ')} |`,
    `| ${sep} |`,
    ...lapsToShow.map((l) => {
      const cells = [
        String(l.lap_index + 1),
        l.intensity ?? 'active',
        lapTimeStr(l),
        formatDistance(l.total_distance, units)
      ];
      if (showPace) cells.push(formatPace(l.avg_pace_s_per_km, units));
      cells.push(
        int(l.avg_heart_rate),
        int(l.max_heart_rate),
        formatElevation(l.total_ascent_m, units),
        formatElevation(l.total_descent_m, units),
        pct(l.avg_grade_pct)
      );
      if (showDrift) cells.push(pct(l.hr_drift_pct));
      if (showDecoupling) cells.push(pct(l.pa_hr_decoupling_pct));
      return `| ${cells.join(' | ')} |`;
    })
  ].join('\n');

  const lapDetailSections = lapsToShow.map((l) => {
    const series = lapSeriesByIndex.get(l.lap_index);
    const binSize = series?.bin_size;
    const binUnit = series?.bin_unit;
    const intensityLine = `**Type:** ${l.intensity ?? 'active'}` +
      (l.lap_trigger ? ` (${l.lap_trigger})` : '');

    let driftLine = null;
    if (showDrift || showDecoupling) {
      if (l.too_short_for_derived) {
        driftLine = '_HR drift / Pa:HR decoupling skipped — lap too short for reliable derivation._';
      } else {
        const parts = [];
        if (showDrift) parts.push(`**HR drift:** ${pct(l.hr_drift_pct)}`);
        if (showDecoupling) parts.push(`**Pa:HR decoupling:** ${pct(l.pa_hr_decoupling_pct)}`);
        if (parts.length > 0) driftLine = parts.join(' · ');
      }
    }

    const headerBitsArr = [
      intensityLine,
      `**Lap time:** ${lapTimeStr(l)}`,
      `**Distance:** ${formatDistance(l.total_distance, units)} ${distUnit}`,
      `**Avg HR:** ${int(l.avg_heart_rate)} (max ${int(l.max_heart_rate)})`
    ];
    if (showPace) headerBitsArr.push(`**Avg pace:** ${formatPace(l.avg_pace_s_per_km, units)}`);
    headerBitsArr.push(
      `**Vert:** ↑${formatElevation(l.total_ascent_m, units)} ↓${formatElevation(l.total_descent_m, units)} ${elevUnit} (${pct(l.avg_grade_pct)})`
    );
    if (l.moving_pct != null && l.moving_pct < 95) {
      headerBitsArr.push(`**Moving:** ${pct(l.moving_pct, 0)}`);
    }
    if (driftLine) headerBitsArr.push(driftLine);
    const headerBits = headerBitsArr.join('  \n');

    if (!series || series.series.length === 0) {
      return `### Lap ${l.lap_index + 1}\n${headerBits}\n\n_No binned series available._`;
    }

    // Bin table — show GAP only when profile uses it.
    const showGap = flags.gap;
    const tableHead = [
      binUnit === 'meters' ? `Dist (${distUnit})` : 't',
      ...(showPace ? ['Pace'] : []),
      'HR',
      'Grade',
      ...(showGap ? ['GAP'] : []),
      'Power'
    ];
    const rows = series.series.map((b) => {
      const tCell =
        binUnit === 'meters'
          ? formatDistance(b.cumulative_distance_m, units, 2)
          : secondsToHms(b.t_offset_s);
      const cells = [tCell];
      if (showPace) cells.push(formatPace(b.avg_pace_s_per_km, units));
      cells.push(int(b.avg_hr), pct(b.grade_pct));
      if (showGap) cells.push(formatPace(b.gap_s_per_km, units));
      cells.push(int(b.avg_power));
      return `| ${cells.join(' | ')} |`;
    });

    return [
      `### Lap ${l.lap_index + 1}`,
      headerBits,
      '',
      `_Binned every ${binSize} ${binUnit}._`,
      '',
      `| ${tableHead.join(' | ')} |`,
      `| ${tableHead.map(() => '---').join(' | ')} |`,
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
