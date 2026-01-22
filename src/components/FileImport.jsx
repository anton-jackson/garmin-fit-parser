import { useState } from 'react';
import FileInfo from './FileInfo';
import { useElectronAPI } from '../hooks/useElectronAPI';

function FileImport({ onFileSelected, selectedFile, isLoading }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const electronAPI = useElectronAPI();

  const handleSelectFile = async () => {
    setIsSelecting(true);
    try {
      // Check if Electron API is available
      if (!window.electronAPI) {
        console.error('Electron API not available. Make sure you are running in Electron.');
        alert('Electron API not available. Please run this app using: npm run electron:dev');
        return;
      }
      
      const filePath = await electronAPI.selectFile();
      if (filePath) {
        onFileSelected(filePath);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      alert(`Error selecting file: ${error.message}`);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Import FIT File
          </h2>
          {selectedFile ? (
            <FileInfo filePath={selectedFile} />
          ) : (
            <p className="text-sm text-gray-500">
              Select a Garmin FIT file to begin
            </p>
          )}
        </div>
        <button
          onClick={handleSelectFile}
          disabled={isSelecting || isLoading}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${isSelecting || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
          `}
        >
          {isSelecting ? 'Selecting...' : 'Select FIT File'}
        </button>
      </div>
    </div>
  );
}

export default FileImport;
