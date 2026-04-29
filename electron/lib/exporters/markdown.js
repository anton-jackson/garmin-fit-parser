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
  formatVAM
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

// Render climbing metrics (VAM, ascent segments, grade buckets) when the
// activity actually had meaningful climbing — flat track sessions stay clean,
// hilly road runs / ski tours / hikes / bike rides all light up automatically.
const CLIMB_TOTAL_ASCENT_M = 100;     // ~330 ft total
const CLIMB_VERT_PER_KM_M = 30;       // ~50 ft/mi

function hadMeaningfulClimbing(session) {
  if (!session) return false;
  const ascent = session.total_ascent_m ?? session.total_ascent ?? 0;
  const vpk = session.vertical_per_km_m ?? 0;
  return ascent >= CLIMB_TOTAL_ASCENT_M || vpk >= CLIMB_VERT_PER_KM_M;
}

export function buildMarkdown(analysis, { selectedLapIndices, sourceFile, lapSeriesByIndex, units = 'imperial' }) {
  const { activity, session, laps, profile, profile_flags, ascent_segments, grade_buckets } = analysis;
  const flags = profile_flags ?? { drift: true, decoupling: true, gap: true, pace_primary: true };
  const climby = hadMeaningfulClimbing(session);
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
  if (climby && session?.vam_m_per_h) {
    summaryLines.push(`**VAM:** ${formatVAM(session.vam_m_per_h, units)}`);
  }
  if (session?.avg_power) summaryLines.push(`**Avg power:** ${int(session.avg_power)} W`);
  if (session?.training_stress_score) summaryLines.push(`**TSS:** ${num(session.training_stress_score, 0)}`);

  const dataQualityLine =
    session?.moving_pct != null || session?.gps_pct != null
      ? `**Data quality:** ${pct(session?.moving_pct, 0)} moving · ${pct(session?.gps_pct, 0)} with GPS`
      : null;
  if (dataQualityLine) summaryLines.push(dataQualityLine);

  const lapsToShow = laps.filter((l) => selectedLapIndices.has(l.lap_index));

  // Column visibility — pace/drift/decoupling are sport-driven; VAM is data-driven.
  const showPace = flags.pace_primary;
  const showDrift = flags.drift;
  const showDecoupling = flags.decoupling;
  const showVAM = climby;

  const headerCols = ['#', 'Type', 'Time', `Dist (${distUnit})`];
  if (showPace) headerCols.push('Pace');
  headerCols.push('Avg HR', 'Max HR', `Vert↑ (${elevUnit})`, `Vert↓ (${elevUnit})`, 'Grade');
  if (showVAM) headerCols.push('VAM');
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
      if (showVAM) cells.push(formatVAM(l.vam_m_per_h, units));
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
    if (showVAM && l.vam_m_per_h) headerBitsArr.push(`**VAM:** ${formatVAM(l.vam_m_per_h, units)}`);
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
    let firstColLabel;
    if (binUnit === 'meters_ascent') firstColLabel = `Elev gain (${elevUnit})`;
    else if (binUnit === 'meters') firstColLabel = `Dist (${distUnit})`;
    else firstColLabel = 't';
    const tableHead = [
      firstColLabel,
      ...(binUnit === 'meters_ascent' ? ['t'] : []),
      ...(showPace ? ['Pace'] : []),
      'HR',
      'Grade',
      ...(showVAM ? ['VAM'] : []),
      ...(showGap ? ['GAP'] : []),
      'Power'
    ];
    const rows = series.series.map((b) => {
      let firstCell;
      if (binUnit === 'meters_ascent') firstCell = formatElevation(b.cumulative_ascent_m, units);
      else if (binUnit === 'meters') firstCell = formatDistance(b.cumulative_distance_m, units, 2);
      else firstCell = secondsToHms(b.t_offset_s);
      const cells = [firstCell];
      if (binUnit === 'meters_ascent') cells.push(secondsToHms(b.t_offset_s));
      if (showPace) cells.push(formatPace(b.avg_pace_s_per_km, units));
      cells.push(int(b.avg_hr), pct(b.grade_pct));
      if (showVAM) cells.push(formatVAM(b.vam_m_per_h, units));
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

  // Optional sections: ascent segments + grade buckets (sport-aware).
  const sections = [
    `# ${title}`,
    '',
    summaryLines.join('  \n'),
    ''
  ];

  if (climby && ascent_segments && ascent_segments.length > 0) {
    sections.push('## Ascent segments', '');
    sections.push(
      `| # | Start | Duration | Ascent (${elevUnit}) | Dist (${distUnit}) | Avg grade | VAM | Avg HR | Max HR |`,
      `| --- | --- | --- | --- | --- | --- | --- | --- | --- |`,
      ...ascent_segments.map((s) =>
        `| ${s.segment_index + 1} | ${isoDate(s.start_time)} | ${secondsToHms(s.moving_s ?? s.elapsed_s)} | ${formatElevation(s.ascent_m, units)} | ${formatDistance(s.distance_m, units)} | ${pct(s.avg_grade_pct)} | ${formatVAM(s.vam_m_per_h, units)} | ${int(s.avg_hr)} | ${int(s.max_hr)} |`
      ),
      ''
    );
  }

  if (climby && grade_buckets && grade_buckets.length > 0) {
    // Skip the section entirely if essentially all the time was within
    // ±5% grade (a flat workout that happens to roll on small bumps).
    const total = grade_buckets.reduce((s, b) => s + (b.record_count ?? 0), 0);
    const flat = grade_buckets.find((b) => b.grade_band === '-5..5');
    const flatPct = total > 0 ? ((flat?.record_count ?? 0) / total) * 100 : 100;
    const nonzero = grade_buckets.filter((b) => (b.record_count ?? 0) > 0);
    if (nonzero.length > 1 && flatPct < 90) {
      sections.push('## Time at grade', '');
      sections.push(
        `| Grade band | Time | Avg HR |`,
        `| --- | --- | --- |`,
        ...nonzero.map((b) =>
          `| ${b.grade_band}% | ${secondsToHms(b.time_s)} | ${int(b.avg_hr)} |`
        ),
        ''
      );
    }
  }

  sections.push(
    '## Laps',
    '',
    lapTable,
    '',
    '## Lap detail',
    '',
    lapDetailSections.join('\n\n')
  );

  return sections.join('\n');
}
