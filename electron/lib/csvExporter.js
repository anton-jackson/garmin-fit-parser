import { writeFile } from 'fs/promises';
import Papa from 'papaparse';

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array<string>} selectedFields - Array of field names to include
 * @param {string} filePath - Path where CSV should be saved
 */
export async function exportToCSV(data, selectedFields, filePath) {
  try {
    // Filter data to only include selected fields
    const filteredData = data.map(record => {
      const filtered = {};
      selectedFields.forEach(field => {
        filtered[field] = record[field] !== undefined ? record[field] : '';
      });
      return filtered;
    });

    // Generate CSV string
    const csv = Papa.unparse(filteredData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    });

    // Write to file
    await writeFile(filePath, csv, 'utf8');
  } catch (error) {
    throw new Error(`Failed to export CSV: ${error.message}`);
  }
}
