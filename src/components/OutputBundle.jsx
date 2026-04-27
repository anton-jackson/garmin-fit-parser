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

function Check({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
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
  selectedLapCount,
  onExport,
  isLoading
}) {
  const canExport =
    !isLoading &&
    selectedLapCount > 0 &&
    (formats.markdown || formats.json || formats.csv);

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
        <div className="flex gap-4">
          <Radio name="preset" value="agent" current={preset} onChange={onPresetChange} label="AI agent (md + json)" />
          <Radio name="preset" value="spreadsheet" current={preset} onChange={onPresetChange} label="Spreadsheet (csv)" />
          <Radio name="preset" value="both" current={preset} onChange={onPresetChange} label="Both" />
          <Radio name="preset" value="custom" current={preset} onChange={onPresetChange} label="Custom" />
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
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Per-lap binned series</div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            <Radio name="binMode" value="time" current={binMode} onChange={onBinModeChange} label="By time" />
            <Radio name="binMode" value="distance" current={binMode} onChange={onBinModeChange} label="By distance" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Bin size:</span>
            <input
              type="number"
              min="1"
              value={binSize ?? ''}
              placeholder={binMode === 'time' ? 'auto (10–60s)' : '100'}
              onChange={(e) => onBinSizeChange(e.target.value === '' ? null : Number(e.target.value))}
              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 text-xs">{binMode === 'time' ? 'seconds' : 'meters'}</span>
          </label>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Options</div>
        <div className="space-y-2">
          <Check
            checked={includeGrade}
            onChange={onIncludeGradeChange}
            label="Include grade columns in CSV"
            hint="Adds grade_pct, grade_pct_smoothed, gap_s_per_km"
          />
          <Check
            checked={includeRawRecordsInJson}
            onChange={onIncludeRawChange}
            label="Embed raw records in JSON"
            hint="Token-heavy; only enable if the agent needs 1 Hz samples"
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
