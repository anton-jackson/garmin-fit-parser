// Type definitions for Electron API exposed via preload script
export interface ElectronAPI {
  selectFile: () => Promise<string | null>;
  parseFile: (filePath: string) => Promise<{
    success: boolean;
    data?: {
      records: any[];
      availableFields: Array<{
        name: string;
        type: string;
        sampleValue: any;
        firstIndex: number;
      }>;
      recordCount: number;
    };
    filePath?: string;
    error?: string;
  }>;
  exportCSV: (
    records: any[],
    selectedFields: string[],
    suggestedName: string
  ) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
