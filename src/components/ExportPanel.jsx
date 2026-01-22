function ExportPanel({ selectedCount, onExport, isLoading }) {
  const isDisabled = selectedCount === 0 || isLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-1">
            Export to CSV
          </h2>
          <p className="text-sm text-gray-500">
            {selectedCount === 0
              ? 'Select at least one field to enable export'
              : `${selectedCount} field${selectedCount !== 1 ? 's' : ''} selected for export`
            }
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={isDisabled}
          className={`
            px-8 py-3 rounded-lg font-medium transition-colors
            ${isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }
          `}
        >
          {isLoading ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>
    </div>
  );
}

export default ExportPanel;
