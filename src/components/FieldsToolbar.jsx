function FieldsToolbar({ totalCount, selectedCount, onSelectAll, onClearAll }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-800">
        Available Fields
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({selectedCount} of {totalCount} selected)
        </span>
      </h2>
      <div className="flex gap-2">
        <button
          onClick={onSelectAll}
          className="px-4 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          Select All
        </button>
        <button
          onClick={onClearAll}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

export default FieldsToolbar;
