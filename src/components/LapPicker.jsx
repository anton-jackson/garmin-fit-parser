import { secondsToHms, paceToStr, int, num, km } from '../utils/format';

function LapPicker({ laps, selectedLaps, onToggleLap, onSelectAll, onClearAll }) {
  if (!laps || laps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-sm text-gray-500">
        No laps in this file.
      </div>
    );
  }

  const allSelected = selectedLaps.size === laps.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">
          Laps
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selectedLaps.size} of {laps.length} selected)
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={allSelected}
            className="px-4 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Select All
          </button>
          <button
            onClick={onClearAll}
            disabled={selectedLaps.size === 0}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <tr>
              <th className="py-2 pr-2"></th>
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">Dist (km)</th>
              <th className="py-2 pr-3">Pace</th>
              <th className="py-2 pr-3">Avg HR</th>
              <th className="py-2 pr-3">Max HR</th>
              <th className="py-2 pr-3">Vert ↑/↓</th>
              <th className="py-2 pr-3">Grade</th>
              <th className="py-2 pr-3">Drift</th>
            </tr>
          </thead>
          <tbody>
            {laps.map((lap) => {
              const checked = selectedLaps.has(lap.lap_index);
              return (
                <tr
                  key={lap.lap_index}
                  className={`border-b border-gray-100 cursor-pointer ${checked ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                  onClick={() => onToggleLap(lap.lap_index)}
                >
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleLap(lap.lap_index)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 pr-3 font-medium text-gray-800">{lap.lap_index + 1}</td>
                  <td className="py-2 pr-3">{secondsToHms(lap.total_elapsed_time ?? lap.total_timer_time)}</td>
                  <td className="py-2 pr-3">{km(lap.total_distance)}</td>
                  <td className="py-2 pr-3">{paceToStr(lap.avg_pace_s_per_km)}</td>
                  <td className="py-2 pr-3">{int(lap.avg_heart_rate)}</td>
                  <td className="py-2 pr-3">{int(lap.max_heart_rate)}</td>
                  <td className="py-2 pr-3">
                    {int(lap.total_ascent_m)} / {int(lap.total_descent_m)}
                  </td>
                  <td className="py-2 pr-3">{num(lap.avg_grade_pct, 1)}%</td>
                  <td className="py-2 pr-3">{num(lap.hr_drift_pct, 1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LapPicker;
