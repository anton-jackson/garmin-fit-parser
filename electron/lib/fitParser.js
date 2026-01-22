import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fitFileParserModule = require('fit-file-parser');
// fit-file-parser exports the constructor as .default
const FitParser = fitFileParserModule.default;

/**
 * Parse a FIT file buffer and extract all available data fields
 * @param {Buffer} fileBuffer - The FIT file as a buffer
 * @returns {Promise<Object>} Parsed data with records and field information
 */
export async function parseFITFile(fileBuffer) {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'ms',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list'
    });

    fitParser.parse(fileBuffer, (error, data) => {
      if (error) {
        reject(new Error(`Failed to parse FIT file: ${error.message}`));
        return;
      }

      if (!data || !data.records) {
        reject(new Error('Invalid FIT file: No records found'));
        return;
      }

      // Extract all unique fields from records
      const fieldMap = new Map();
      const records = data.records || [];

      records.forEach((record, index) => {
        Object.keys(record).forEach(fieldName => {
          if (!fieldMap.has(fieldName)) {
            fieldMap.set(fieldName, {
              name: fieldName,
              type: typeof record[fieldName],
              sampleValue: record[fieldName],
              firstIndex: index
            });
          }
        });
      });

      // Convert map to array and sort by field name
      const availableFields = Array.from(fieldMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      resolve({
        records: records,
        availableFields: availableFields,
        recordCount: records.length
      });
    });
  });
}
