function FieldItem({ field, isSelected, onToggle }) {
  const formatSampleValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return String(value);
  };

  return (
    <div
      className={`
        flex items-center p-3 rounded-lg cursor-pointer transition-all
        border-2
        ${isSelected
          ? 'bg-blue-50 border-blue-400 hover:bg-blue-100'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
        }
      `}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
      />
      <div className="flex-1 grid grid-cols-3 gap-4 items-center">
        <span className="font-medium text-gray-800">{field.name}</span>
        <span className="text-sm text-gray-600 font-mono">
          {field.type || 'unknown'}
        </span>
        <span className="text-sm text-gray-500 truncate" title={formatSampleValue(field.sampleValue)}>
          {formatSampleValue(field.sampleValue)}
        </span>
      </div>
    </div>
  );
}

export default FieldItem;
