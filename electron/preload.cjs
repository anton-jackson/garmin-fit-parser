const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  console.log('[PRELOAD] Preload script starting...');
  console.log('[PRELOAD] contextBridge available:', typeof contextBridge !== 'undefined');
  console.log('[PRELOAD] ipcRenderer available:', typeof ipcRenderer !== 'undefined');
  
  contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    parseFile: (filePath) => ipcRenderer.invoke('parse-file', filePath),
    exportCSV: (records, selectedFields, suggestedName) => ipcRenderer.invoke('export-csv', records, selectedFields, suggestedName)
  });
  
  console.log('[PRELOAD] ✓ electronAPI exposed to window');
  console.log('[PRELOAD] Available methods:', Object.keys({
    selectFile: () => {},
    parseFile: () => {},
    exportCSV: () => {}
  }));
} catch (error) {
  console.error('[PRELOAD] ✗ Error loading preload script:', error);
  console.error('[PRELOAD] Error stack:', error.stack);
}
