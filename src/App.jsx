import { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FileImport from './components/FileImport';
import ActivitySummary from './components/ActivitySummary';
import LapPicker from './components/LapPicker';
import OutputBundle from './components/OutputBundle';
import FieldSelector from './components/FieldSelector';
import StatusMessage from './components/StatusMessage';
import { useElectronAPI } from './hooks/useElectronAPI';

const PRESETS = {
  agent:       { markdown: true,  json: true,  csv: false },
  spreadsheet: { markdown: false, json: false, csv: true  },
  both:        { markdown: true,  json: true,  csv: true  }
};

function App() {
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('⚠️ Electron API not found. This app must run in Electron.');
    }
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);

  // Lap selection
  const [selectedLaps, setSelectedLaps] = useState(new Set());

  // Export options
  const [preset, setPreset] = useState('agent');
  const [formats, setFormats] = useState(PRESETS.agent);
  const [binMode, setBinMode] = useState('time');
  const [binSize, setBinSize] = useState(null);
  const [includeGrade, setIncludeGrade] = useState(false);
  const [includeRawRecordsInJson, setIncludeRawRecordsInJson] = useState(false);
  const [units, setUnits] = useState('imperial');

  // Legacy raw-field selection (Advanced disclosure)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFields, setSelectedFields] = useState(new Set());

  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const electronAPI = useElectronAPI();

  const handleFileSelected = useCallback(async (filePath) => {
    if (!filePath) return;

    setIsLoading(true);
    setStatus({ message: 'Parsing FIT file...', type: 'info' });
    setSelectedFile(filePath);

    try {
      const result = await electronAPI.parseFile(filePath);

      if (!result.success) {
        setStatus({ message: result.error || 'Failed to parse file', type: 'error' });
        setSelectedFile(null);
        setParsedData(null);
        setAnalysis(null);
        setAvailableFields([]);
        setSelectedLaps(new Set());
        setSelectedFields(new Set());
        return;
      }

      const data = result.data;
      setParsedData(data);
      setAnalysis(data.analysis);
      setAvailableFields(data.availableFields || []);
      const allLapIndices = (data.analysis?.laps || []).map((l) => l.lap_index);
      setSelectedLaps(new Set(allLapIndices));
      setSelectedFields(new Set());
      setStatus({
        message: `Parsed ${data.recordCount || 0} records · ${data.lapCount || 0} laps`,
        type: 'success'
      });
    } catch (error) {
      setStatus({ message: error.message || 'An error occurred', type: 'error' });
      setSelectedFile(null);
      setParsedData(null);
      setAnalysis(null);
      setAvailableFields([]);
      setSelectedLaps(new Set());
      setSelectedFields(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI]);

  const handleToggleLap = useCallback((lapIndex) => {
    setSelectedLaps((prev) => {
      const next = new Set(prev);
      if (next.has(lapIndex)) next.delete(lapIndex);
      else next.add(lapIndex);
      return next;
    });
  }, []);

  const handleSelectAllLaps = useCallback(() => {
    if (!analysis) return;
    setSelectedLaps(new Set(analysis.laps.map((l) => l.lap_index)));
  }, [analysis]);

  const handleClearAllLaps = useCallback(() => setSelectedLaps(new Set()), []);

  const handlePresetChange = useCallback((next) => {
    setPreset(next);
    if (next !== 'custom' && PRESETS[next]) setFormats(PRESETS[next]);
  }, []);

  const handleFormatChange = useCallback((key, value) => {
    setFormats((prev) => ({ ...prev, [key]: value }));
    setPreset('custom');
  }, []);

  const suggestedBaseName = useMemo(() => {
    if (!selectedFile) return 'activity';
    return selectedFile.split(/[\\/]/).pop().replace(/\.fit$/i, '');
  }, [selectedFile]);

  const handleExportBundle = useCallback(async () => {
    if (!analysis || selectedLaps.size === 0) {
      setStatus({ message: 'Select at least one lap', type: 'error' });
      return;
    }
    if (!formats.markdown && !formats.json && !formats.csv) {
      setStatus({ message: 'Select at least one output format', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatus({ message: 'Exporting…', type: 'info' });

    try {
      const result = await electronAPI.exportBundle(
        analysis,
        {
          selectedLapIndices: Array.from(selectedLaps).sort((a, b) => a - b),
          formats,
          binMode,
          binSize,
          includeGrade,
          includeRawRecordsInJson,
          units
        },
        suggestedBaseName
      );

      if (result.canceled) {
        setStatus({ message: 'Export canceled', type: 'info' });
        return;
      }
      if (!result.success) {
        setStatus({ message: result.error || 'Export failed', type: 'error' });
        return;
      }
      const files = (result.written || []).map((p) => p.split(/[\\/]/).pop()).join(', ');
      setStatus({ message: `Exported: ${files}`, type: 'success' });
    } catch (error) {
      setStatus({ message: error.message || 'Export failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [analysis, selectedLaps, formats, binMode, binSize, includeGrade, includeRawRecordsInJson, units, electronAPI, suggestedBaseName]);

  // Legacy raw-CSV export (Advanced)
  const handleLegacyExport = useCallback(async () => {
    if (selectedFields.size === 0 || !parsedData) {
      setStatus({ message: 'Select at least one field to export', type: 'error' });
      return;
    }
    setIsLoading(true);
    setStatus({ message: 'Exporting raw CSV…', type: 'info' });
    try {
      const result = await electronAPI.exportCSV(
        parsedData.records,
        Array.from(selectedFields),
        `${suggestedBaseName}.csv`
      );
      if (result.canceled) {
        setStatus({ message: 'Export canceled', type: 'info' });
        return;
      }
      if (!result.success) {
        setStatus({ message: result.error || 'Export failed', type: 'error' });
        return;
      }
      setStatus({ message: `Exported to ${result.filePath}`, type: 'success' });
    } catch (error) {
      setStatus({ message: error.message || 'Export failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFields, parsedData, electronAPI, suggestedBaseName]);

  const toggleLegacyField = useCallback((name) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);
  const selectAllLegacy = useCallback(
    () => setSelectedFields(new Set(availableFields.map((f) => f.name))),
    [availableFields]
  );
  const clearAllLegacy = useCallback(() => setSelectedFields(new Set()), []);

  // Drag-and-drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDraggingOver) setIsDraggingOver(true);
  }, [isDraggingOver]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    const file = files[0];
    const path = file.path;
    if (!path) return;
    const lower = (file.name || path).toLowerCase();
    if (!lower.endsWith('.fit')) {
      setStatus({ message: 'Please drop a .FIT file', type: 'error' });
      return;
    }
    handleFileSelected(path);
  }, [handleFileSelected]);

  const hasAnalysis = !!analysis;

  return (
    <div
      className="flex flex-col h-screen bg-gray-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header />
      {isDraggingOver && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg m-2 pointer-events-none"
          aria-hidden
        >
          <div className="bg-white/95 rounded-xl shadow-lg px-8 py-6 text-center">
            <p className="text-lg font-medium text-gray-800">Drop FIT file here</p>
            <p className="text-sm text-gray-500 mt-1">Release to load the file</p>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <FileImport
          onFileSelected={handleFileSelected}
          selectedFile={selectedFile}
          isLoading={isLoading}
        />

        {hasAnalysis && <ActivitySummary analysis={analysis} units={units} />}

        {hasAnalysis && (
          <LapPicker
            laps={analysis.laps}
            selectedLaps={selectedLaps}
            onToggleLap={handleToggleLap}
            onSelectAll={handleSelectAllLaps}
            onClearAll={handleClearAllLaps}
            units={units}
          />
        )}

        {hasAnalysis && (
          <OutputBundle
            preset={preset}
            onPresetChange={handlePresetChange}
            formats={formats}
            onFormatChange={handleFormatChange}
            binMode={binMode}
            onBinModeChange={setBinMode}
            binSize={binSize}
            onBinSizeChange={setBinSize}
            includeGrade={includeGrade}
            onIncludeGradeChange={setIncludeGrade}
            includeRawRecordsInJson={includeRawRecordsInJson}
            onIncludeRawChange={setIncludeRawRecordsInJson}
            units={units}
            onUnitsChange={setUnits}
            selectedLapCount={selectedLaps.size}
            onExport={handleExportBundle}
            isLoading={isLoading}
          />
        )}

        {hasAnalysis && (
          <details
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced(e.currentTarget.open)}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Advanced: pick raw CSV columns (legacy)
            </summary>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-xs text-gray-500">
                Pick any of the raw fields parsed from the file. Writes a single CSV with the
                selected columns across all records (no lap filtering).
              </p>
              <FieldSelector
                fields={availableFields}
                selectedFields={selectedFields}
                onFieldToggle={toggleLegacyField}
                onSelectAll={selectAllLegacy}
                onClearAll={clearAllLegacy}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleLegacyExport}
                  disabled={selectedFields.size === 0 || isLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    selectedFields.size === 0 || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  Export raw CSV
                </button>
              </div>
            </div>
          </details>
        )}
      </div>
      <StatusMessage
        message={status.message}
        type={status.type}
        onDismiss={() => setStatus({ message: '', type: '' })}
      />
    </div>
  );
}

export default App;
