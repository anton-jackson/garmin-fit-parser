import { useCallback } from 'react';

/**
 * Custom hook for Electron API communication
 * Provides typed access to window.electronAPI
 */
export function useElectronAPI() {
  const selectFile = useCallback(async () => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.selectFile();
  }, []);

  const parseFile = useCallback(async (filePath) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.parseFile(filePath);
  }, []);

  const exportCSV = useCallback(async (records, selectedFields, suggestedName) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.exportCSV(records, selectedFields, suggestedName);
  }, []);

  return {
    selectFile,
    parseFile,
    exportCSV
  };
}
