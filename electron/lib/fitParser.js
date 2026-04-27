import { analyzeFITFile } from './fitAnalyzer/index.js';

/**
 * Parse a FIT file buffer.
 *
 * Returns the legacy shape (records / laps / availableFields / sessions /
 * activity / counts) that the existing renderer consumes, plus a new
 * `analysis` object with the structured + derived + binned data:
 *   analysis: { activity, session, sessions, laps[], records[], lapSeries[] }
 *
 * Records and laps in `analysis` are enriched with derived metrics; the
 * top-level `records` / `laps` mirror those enriched arrays so existing CSV
 * export continues to work unchanged.
 */
export async function parseFITFile(fileBuffer) {
  const analysis = await analyzeFITFile(fileBuffer);

  // Legacy field discovery — collect every key seen across records/laps/session/activity.
  const recordFieldMap = new Map();
  analysis.records.forEach((record, index) => {
    Object.keys(record).forEach((name) => {
      if (!recordFieldMap.has(name)) {
        recordFieldMap.set(name, {
          name,
          type: typeof record[name],
          sampleValue: record[name],
          firstIndex: index
        });
      }
    });
  });

  const lapFieldMap = new Map();
  analysis.laps.forEach((lap, index) => {
    Object.keys(lap).forEach((name) => {
      const prefixed = `lap_${name}`;
      if (!lapFieldMap.has(prefixed)) {
        lapFieldMap.set(prefixed, {
          name: prefixed,
          type: typeof lap[name],
          sampleValue: lap[name],
          firstIndex: index
        });
      }
    });
  });

  const sessionFieldMap = new Map();
  if (analysis.session) {
    Object.keys(analysis.session).forEach((name) => {
      const val = analysis.session[name];
      if (val == null || typeof val === 'object') return;
      sessionFieldMap.set(`session_${name}`, {
        name: `session_${name}`,
        type: typeof val,
        sampleValue: val,
        firstIndex: 0
      });
    });
  }

  const activityFieldMap = new Map();
  if (analysis.activity && typeof analysis.activity === 'object') {
    Object.keys(analysis.activity).forEach((name) => {
      const val = analysis.activity[name];
      if (val == null || typeof val === 'object') return;
      activityFieldMap.set(`activity_${name}`, {
        name: `activity_${name}`,
        type: typeof val,
        sampleValue: val,
        firstIndex: 0
      });
    });
  }

  const sortByName = (a, b) => a.name.localeCompare(b.name);
  const recordFields = Array.from(recordFieldMap.values()).sort(sortByName);
  const lapFields = Array.from(lapFieldMap.values()).sort(sortByName);
  const sessionFields = Array.from(sessionFieldMap.values()).sort(sortByName);
  const activityFields = Array.from(activityFieldMap.values()).sort(sortByName);

  return {
    records: analysis.records,
    laps: analysis.laps,
    sessions: analysis.sessions,
    activity: analysis.activity,
    recordCount: analysis.records.length,
    lapCount: analysis.laps.length,
    availableFields: [...recordFields, ...lapFields, ...sessionFields, ...activityFields],
    analysis
  };
}
