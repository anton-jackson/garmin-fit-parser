import { writeFile } from 'fs/promises';
import { dirname, basename, extname, join } from 'path';
import { binAllLaps } from '../fitAnalyzer/bin.js';
import { buildMarkdown } from './markdown.js';
import { buildJSON } from './json.js';
import { buildRecordsCsv } from './recordsCsv.js';

/**
 * Write an export bundle. `basePath` is the user-chosen save path; we strip
 * its extension and write sibling files for each enabled format.
 *
 * options: {
 *   selectedLapIndices: number[],
 *   formats: { markdown, json, csv },     // booleans
 *   binMode: 'time'|'distance',
 *   binSize: number|null,
 *   includeGrade: boolean,                // adds grade columns to CSV
 *   includeRawRecordsInJson: boolean      // embed records[] in the .json
 * }
 */
export async function writeBundle(analysis, basePath, options) {
  const {
    selectedLapIndices,
    formats,
    binMode = 'time',
    binSize = null,
    includeGrade = false,
    includeRawRecordsInJson = false,
    units = 'imperial'
  } = options;

  const dir = dirname(basePath);
  const stem = basename(basePath, extname(basePath));
  const stub = join(dir, stem);
  const lapSet = new Set(selectedLapIndices);

  // Re-bin laps with the user's chosen settings (the analysis was binned with
  // defaults; redo here so the user can change bin size without re-parsing).
  const lapSeries = binAllLaps(analysis.laps, analysis.records, { mode: binMode, binSize });
  const lapSeriesByIndex = new Map(lapSeries.map((s) => [s.lap_index, s]));

  const written = [];

  if (formats.markdown) {
    const md = buildMarkdown(analysis, {
      selectedLapIndices: lapSet,
      sourceFile: stem,
      lapSeriesByIndex,
      units
    });
    const p = `${stub}.md`;
    await writeFile(p, md, 'utf8');
    written.push(p);
  }

  if (formats.json) {
    const json = buildJSON(analysis, {
      selectedLapIndices: lapSet,
      includeRecords: includeRawRecordsInJson,
      lapSeriesByIndex,
      units
    });
    const p = `${stub}.json`;
    await writeFile(p, json, 'utf8');
    written.push(p);
  }

  if (formats.csv) {
    const csv = buildRecordsCsv(analysis, { selectedLapIndices: lapSet, includeGrade, units });
    const p = `${stub}.csv`;
    await writeFile(p, csv, 'utf8');
    written.push(p);
  }

  return written;
}
