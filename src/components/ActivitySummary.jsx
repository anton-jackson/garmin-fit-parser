import { secondsToHms, paceToStr, int, km, isoDate } from '../utils/format';

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-medium text-gray-800">{value}</div>
    </div>
  );
}

function ActivitySummary({ analysis }) {
  if (!analysis) return null;
  const { activity, session, laps } = analysis;
  const sport = session?.sport ?? activity?.sport ?? 'activity';
  const start = session?.start_time ?? activity?.timestamp ?? laps[0]?.start_time;
  const elapsed = session?.total_elapsed_time ?? session?.total_timer_time;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 capitalize">{sport}</h2>
        <span className="text-sm text-gray-500">{isoDate(start)}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Duration" value={secondsToHms(elapsed)} />
        <Stat label="Distance" value={`${km(session?.total_distance)} km`} />
        <Stat
          label="Elevation"
          value={`↑${int(session?.total_ascent_m ?? session?.total_ascent)} / ↓${int(session?.total_descent_m ?? session?.total_descent)} m`}
        />
        <Stat label="Vert/km" value={`${int(session?.vertical_per_km_m)} m`} />
        <Stat label="Avg HR" value={`${int(session?.avg_heart_rate)} bpm`} />
        <Stat label="Max HR" value={`${int(session?.max_heart_rate)} bpm`} />
        <Stat label="Avg pace" value={paceToStr(session?.avg_pace_s_per_km)} />
        <Stat label="Laps" value={String(laps.length)} />
      </div>
    </div>
  );
}

export default ActivitySummary;
