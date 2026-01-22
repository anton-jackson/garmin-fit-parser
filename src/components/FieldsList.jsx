import FieldItem from './FieldItem';

function FieldsList({ fields, selectedFields, onFieldToggle }) {
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No fields available
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {fields.map((field) => (
        <FieldItem
          key={field.name}
          field={field}
          isSelected={selectedFields.has(field.name)}
          onToggle={() => onFieldToggle(field.name)}
        />
      ))}
    </div>
  );
}

export default FieldsList;
