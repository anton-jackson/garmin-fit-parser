const PRESET_OPTIONS = [
  {
    value: 'agent',
    title: 'For an AI agent',
    description:
      'Markdown summary + structured JSON. Compact, with pace / grade / HR drift pre-computed per lap and per bin so the agent doesn\'t have to do arithmetic. Best for feeding the activity to an LLM.'
  },
  {
    value: 'spreadsheet',
    title: 'For a spreadsheet',
    description: 'Records CSV with one row per sample, filtered to the laps you selected. Open in Excel or Google Sheets.'
  },
  {
    value: 'both',
    title: 'Both',
    description: 'All three files: markdown, JSON, and records CSV.'
  },
  {
    value: 'custom',
    title: 'Custom',
    description: 'Pick formats individually below.'
  }
];

function PresetCard({ option, current, onChange }) {
  const selected = current === option.value;
  return (
    <label
      className={`block cursor-pointer rounded-lg border-2 p-3 transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name="preset"
          value={option.value}
          checked={selected}
          onChange={() => onChange(option.value)}
          className="mt-1 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <div className="text-sm font-medium text-gray-800">{option.title}</div>
          <div className="text-xs text-gray-600 mt-0.5 leading-snug">{option.description}</div>
        </div>
      </div>
    </label>
  );
}

function Check({ checked, onChange, label, hint, disabled }) {
  return (
    <label
      className={`flex items-start gap-2 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}

function Radio({ name, value, current, onChange, label }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  );
}

function OutputBundle({
  preset,
  onPresetChange,
  formats,
  onFormatChange,
  binMode,
  onBinModeChange,
  binSize,
  onBinSizeChange,
  includeGrade,
  onIncludeGradeChange,
  includeRawRecordsInJson,
  onIncludeRawChange,
  units,
  onUnitsChange,
  selectedLapCount,
  onExport,
  isLoading
}) {
  const canExport =
    !isLoading &&
    selectedLapCount > 0 &&
    (formats.markdown || formats.json || formats.csv);

  const csvDisabled = !formats.csv;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">Export</h2>
        <span className="text-sm text-gray-500">
          {selectedLapCount} lap{selectedLapCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Preset</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <PresetCard key={opt.value} option={opt} current={preset} onChange={onPresetChange} />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Formats</div>
        <div className="grid grid-cols-3 gap-3">
          <Check
            checked={formats.markdown}
            onChange={(v) => onFormatChange('markdown', v)}
            label="Markdown (.md)"
            hint="Session + lap tables + per-lap binned series"
          />
          <Check
            checked={formats.json}
            onChange={(v) => onFormatChange('json', v)}
            label="JSON (.json)"
            hint="Structured data for agents"
          />
          <Check
            checked={formats.csv}
            onChange={(v) => onFormatChange('csv', v)}
            label="Records CSV (.csv)"
            hint="Per-record samples for selected laps"
          />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Units</div>
        <div className="flex gap-4">
          <Radio name="units" value="imperial" current={units} onChange={onUnitsChange} label="Imperial (mi / ft)" />
          <Radio name="units" value="metric" current={units} onChange={onUnitsChange} label="Metric (km / m)" />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Per-lap binned series</div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            <Radio name="binMode" value="time" current={binMode} onChange={onBinModeChange} label="By time" />
            <Radio name="binMode" value="distance" current={binMode} onChange={onBinModeChange} label="By distance" />
            <Radio name="binMode" value="elevation" current={binMode} onChange={onBinModeChange} label="By elevation gain" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Bin size:</span>
            <input
              type="number"
              min="1"
              value={binSize ?? ''}
              placeholder={
                binMode === 'time' ? 'auto (10–60s)' :
                binMode === 'elevation' ? '50' : '100'
              }
              onChange={(e) => onBinSizeChange(e.target.value === '' ? null : Number(e.target.value))}
              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 text-xs">
              {binMode === 'time' ? 'seconds' : 'meters'}
              {binMode === 'elevation' ? ' of ascent' : ''}
            </span>
          </label>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">CSV options</div>
        <div className="space-y-2">
          <Check
            checked={includeGrade && !csvDisabled}
            disabled={csvDisabled}
            onChange={onIncludeGradeChange}
            label="Add grade columns to CSV"
            hint={
              csvDisabled
                ? 'Enable Records CSV above to use this option. Grade is always present in markdown and JSON.'
                : 'Adds grade_pct, grade_pct_smoothed, gap_s_per_km columns.'
            }
          />
          <Check
            checked={includeRawRecordsInJson}
            disabled={!formats.json}
            onChange={onIncludeRawChange}
            label="Embed raw records in JSON"
            hint={
              !formats.json
                ? 'Enable JSON above to use this option.'
                : 'Token-heavy; only enable if the agent needs 1 Hz samples.'
            }
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onExport}
          disabled={!canExport}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            canExport
              ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </div>
  );
}

export default OutputBundle;
