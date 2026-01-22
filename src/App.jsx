import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import FileImport from './components/FileImport';
import FieldSelector from './components/FieldSelector';
import ExportPanel from './components/ExportPanel';
import StatusMessage from './components/StatusMessage';
import { useElectronAPI } from './hooks/useElectronAPI';

function App() {
  // Debug: Check if Electron API is available
  useEffect(() => {
    console.log('=== Electron API Debug ===');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('Available:', !!window.electronAPI);
    if (window.electronAPI) {
      console.log('Methods:', Object.keys(window.electronAPI));
    } else {
      console.error('⚠️ Electron API not found. This app must run in Electron.');
      console.error('Make sure the preload script is loading correctly.');
    }
  }, []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

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
        setAvailableFields([]);
        setSelectedFields(new Set());
        return;
      }

      setParsedData(result.data);
      setAvailableFields(result.data.availableFields || []);
      setSelectedFields(new Set());
      setStatus({ 
        message: `Successfully parsed ${result.data.recordCount || 0} records`, 
        type: 'success' 
      });
    } catch (error) {
      setStatus({ message: error.message || 'An error occurred', type: 'error' });
      setSelectedFile(null);
      setParsedData(null);
      setAvailableFields([]);
      setSelectedFields(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI]);

  const handleFieldToggle = useCallback((fieldName) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName);
      } else {
        newSet.add(fieldName);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFields(new Set(availableFields.map(f => f.name)));
  }, [availableFields]);

  const handleClearAll = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedFields.size === 0 || !parsedData) {
      setStatus({ message: 'Please select at least one field to export', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatus({ message: 'Preparing export...', type: 'info' });

    try {
      const selectedFieldsArray = Array.from(selectedFields);
      const fileName = selectedFile 
        ? `${selectedFile.split('/').pop().replace(/\.fit$/i, '')}.csv`
        : 'export.csv';

      const result = await electronAPI.exportCSV(
        parsedData.records,
        selectedFieldsArray,
        fileName
      );

      if (result.canceled) {
        setStatus({ message: 'Export canceled', type: 'info' });
        return;
      }

      if (!result.success) {
        setStatus({ message: result.error || 'Export failed', type: 'error' });
        return;
      }

      setStatus({ 
        message: `Successfully exported to ${result.filePath}`, 
        type: 'success' 
      });
    } catch (error) {
      setStatus({ message: error.message || 'Export failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFields, parsedData, selectedFile, electronAPI]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <FileImport 
          onFileSelected={handleFileSelected}
          selectedFile={selectedFile}
          isLoading={isLoading}
        />
        
        {availableFields.length > 0 && (
          <FieldSelector
            fields={availableFields}
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />
        )}

        {availableFields.length > 0 && (
          <ExportPanel
            selectedCount={selectedFields.size}
            onExport={handleExport}
            isLoading={isLoading}
          />
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
