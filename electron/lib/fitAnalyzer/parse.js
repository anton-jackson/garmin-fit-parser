import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const FitParser = require('fit-file-parser').default;

export function parseRaw(buffer) {
  return new Promise((resolve, reject) => {
    const fp = new FitParser({
      force: true,
      speedUnit: 'ms',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list'
    });
    fp.parse(buffer, (err, data) => {
      if (err) return reject(new Error(`Failed to parse FIT file: ${err.message}`));
      if (!data) return reject(new Error('Invalid FIT file: No data found'));
      resolve(data);
    });
  });
}

function toMs(t) {
  if (t == null) return null;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t < 1e12 ? t * 1000 : t;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export function buildStructured(raw) {
  const records = (raw.records || []).slice();
  const laps = (raw.laps || []).slice();
  const sessions = raw.sessions || [];
  const activity = raw.activity && typeof raw.activity === 'object' ? raw.activity : {};

  // Sort records by timestamp where available
  if (records.length > 0 && records[0].timestamp != null) {
    records.sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));
  }

  // [start, end) windows in ms for each lap
  const lapWindows = laps.map((lap) => {
    const start = toMs(lap.start_time);
    const elapsedSec = lap.total_elapsed_time ?? lap.total_timer_time ?? null;
    const end = start != null && elapsedSec != null ? start + elapsedSec * 1000 : null;
    return { start, end };
  });

  // Assign lap_index via single forward pass (records are sorted by ts)
  let cursor = 0;
  const enrichedRecords = records.map((rec) => {
    const ts = toMs(rec.timestamp);
    let lapIndex = -1;

    if (lapWindows.length === 0) {
      return { ...rec, lap_index: lapIndex };
    }
    if (ts == null) {
      return { ...rec, lap_index: cursor };
    }

    while (
      cursor < lapWindows.length - 1 &&
      lapWindows[cursor].end != null &&
      ts >= lapWindows[cursor].end
    ) {
      cursor++;
    }

    const w = lapWindows[cursor];
    if (w.start != null && ts < w.start) {
      lapIndex = -1;
    } else {
      lapIndex = cursor;
    }
    return { ...rec, lap_index: lapIndex };
  });

  const enrichedLaps = laps.map((lap, i) => ({ lap_index: i, ...lap }));
  const session = sessions.length > 0 ? sessions[0] : null;

  return {
    activity,
    session,
    sessions,
    laps: enrichedLaps,
    records: enrichedRecords
  };
}

export { toMs };
