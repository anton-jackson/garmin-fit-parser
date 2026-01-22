import FieldsToolbar from './FieldsToolbar';
import FieldsList from './FieldsList';

function FieldSelector({ 
  fields, 
  selectedFields, 
  onFieldToggle, 
  onSelectAll, 
  onClearAll 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <FieldsToolbar
        totalCount={fields.length}
        selectedCount={selectedFields.size}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
      />
      <FieldsList
        fields={fields}
        selectedFields={selectedFields}
        onFieldToggle={onFieldToggle}
      />
    </div>
  );
}

export default FieldSelector;
