function FileInfo({ filePath }) {
  const fileName = filePath.split('/').pop();
  const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-start">
        <svg 
          className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 truncate mt-1">
            {fileDir}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FileInfo;
