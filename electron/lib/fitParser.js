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

      if (!data) {
        reject(new Error('Invalid FIT file: No data found'));
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

      // Extract lap data if available
      const laps = data.laps || [];
      let lapFields = [];
      if (laps.length > 0) {
        const lapFieldMap = new Map();
        laps.forEach((lap, index) => {
          Object.keys(lap).forEach(fieldName => {
            if (!lapFieldMap.has(fieldName)) {
              lapFieldMap.set(fieldName, {
                name: `lap_${fieldName}`, // Prefix with 'lap_' to distinguish from record fields
                type: typeof lap[fieldName],
                sampleValue: lap[fieldName],
                firstIndex: index
              });
            }
          });
        });
        lapFields = Array.from(lapFieldMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      }

      // Extract session fields (often includes total_distance, total_elapsed_time, etc.)
      const sessions = data.sessions || [];
      let sessionFields = [];
      if (sessions.length > 0) {
        const sessionFieldMap = new Map();
        sessions.forEach((session, index) => {
          Object.keys(session).forEach(fieldName => {
            if (!sessionFieldMap.has(fieldName)) {
              sessionFieldMap.set(fieldName, {
                name: `session_${fieldName}`,
                type: typeof session[fieldName],
                sampleValue: session[fieldName],
                firstIndex: index
              });
            }
          });
        });
        sessionFields = Array.from(sessionFieldMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      }

      // Extract activity fields (overall summary - activity is an object with nested data)
      const activity = data.activity || {};
      let activityFields = [];
      if (typeof activity === 'object' && !Array.isArray(activity) && Object.keys(activity).length > 0) {
        const activityFieldMap = new Map();
        Object.keys(activity).forEach(fieldName => {
          const val = activity[fieldName];
          if (val === null || val === undefined || typeof val === 'object') return; // skip nested objects
          activityFieldMap.set(fieldName, {
            name: `activity_${fieldName}`,
            type: typeof val,
            sampleValue: val,
            firstIndex: 0
          });
        });
        activityFields = Array.from(activityFieldMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      }

      // Convert map to array and sort by field name
      const availableFields = Array.from(fieldMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      // Combine record, lap, session, and activity fields
      const allFields = [...availableFields, ...lapFields, ...sessionFields, ...activityFields];

      resolve({
        records: records,
        laps: laps,
        availableFields: allFields,
        recordCount: records.length,
        lapCount: laps.length,
        sessions: data.sessions || [],
        activity: data.activity || null
      });
    });
  });
}
