# FIT File Data Exporter - Requirements Document

## Project Overview
A desktop macOS application that allows users to import Garmin .FIT files, inspect available data fields, select desired fields for export, and save the data as a CSV file to a user-specified location.

## Technology Stack
- **Framework**: Electron (provides cross-platform desktop wrapper)
- **Frontend**: React with modern hooks
- **Build Tool**: Vite (for fast development and building)
- **Styling**: CSS Modules or Tailwind CSS (recommend Tailwind for rapid, clean UI development)
- **FIT File Processing**: fit-file-parser or easy-fit npm package
- **CSV Generation**: papaparse npm package
- **Platform**: macOS (packaged as .dmg)

## Core Functional Requirements

### 1. File Import
- **FR-1.1**: Application shall provide a "Select FIT File" button that opens a native macOS file picker
- **FR-1.2**: File picker shall filter to show only .FIT files (with option to show all files)
- **FR-1.3**: Upon file selection, application shall display the full file path/name for user confirmation
- **FR-1.4**: Application shall validate that the selected file is a valid FIT file format
- **FR-1.5**: If file is invalid, display clear error message and allow user to select a different file

### 2. Data Field Discovery & Display
- **FR-2.1**: Application shall parse the FIT file and identify all available data fields (e.g., timestamp, heart_rate, cadence, power, distance, speed, altitude, temperature, latitude, longitude)
- **FR-2.2**: Application shall display all discovered fields in a scrollable list/table
- **FR-2.3**: Each field shall display:
  - Field name
  - Data type (if available)
  - Sample value from first record (to help user understand the data)
  - Checkbox for selection
- **FR-2.4**: Application shall provide "Select All" and "Deselect All" buttons for convenience

### 3. Field Selection
- **FR-3.1**: User shall be able to select/deselect individual fields via checkboxes
- **FR-3.2**: Application shall display count of selected fields
- **FR-3.3**: Application shall require at least one field to be selected before allowing export
- **FR-3.4**: Selected fields shall be visually distinct (highlighted or marked)

### 4. CSV Export
- **FR-4.1**: Application shall provide an "Export to CSV" button (disabled until at least one field is selected)
- **FR-4.2**: Upon clicking export, application shall open native macOS save dialog
- **FR-4.3**: Save dialog shall:
  - Default to user's Desktop folder
  - Pre-populate filename as "[original_fit_filename].csv"
  - Allow user to navigate to any desired save location
  - Allow user to rename the output file
- **FR-4.4**: Application shall generate CSV with:
  - Header row containing selected field names
  - One row per data record from FIT file
  - Proper CSV formatting (quoted strings if needed, comma-separated)
- **FR-4.5**: Upon successful export, display success message with file path
- **FR-4.6**: If export fails, display clear error message

### 5. User Interface Requirements
- **FR-5.1**: Application window shall be resizable with minimum dimensions of 800x600 pixels
- **FR-5.2**: Default window size: 1000x700 pixels
- **FR-5.3**: Interface shall follow a clear workflow: Import → Review Fields → Select Fields → Export
- **FR-5.4**: All interactive elements (buttons, checkboxes) shall provide visual feedback on hover/click
- **FR-5.5**: Application shall use standard macOS UI conventions where applicable
- **FR-5.6**: UI shall be responsive and maintain clean layout across different window sizes

## React Component Architecture

### Component Hierarchy
```
App (main container)
├── Header (app title/branding)
├── FileImport (file selection component)
│   └── FileInfo (displays selected file details)
├── FieldSelector (main field selection interface)
│   ├── FieldsToolbar (Select All/Clear All buttons + selected count)
│   └── FieldsList (scrollable list of fields)
│       └── FieldItem (individual field checkbox with details) [multiple]
├── ExportPanel (export button and status)
└── StatusMessage (success/error notifications)
```

### Key React Components

#### 1. App Component
```jsx
// Main application state management
- State: selectedFile, parsedFields, selectedFields, statusMessage
- Handles IPC communication with Electron main process
- Manages global application state
```

#### 2. FileImport Component
```jsx
// Handles file selection
- Props: onFileSelected
- Triggers Electron dialog via IPC
- Displays selected file information
```

#### 3. FieldSelector Component
```jsx
// Main field selection interface
- Props: fields, selectedFields, onFieldToggle, onSelectAll, onClearAll
- Renders list of available fields
- Manages bulk selection actions
```

#### 4. FieldItem Component
```jsx
// Individual field row
- Props: field, isSelected, onToggle
- Displays: checkbox, field name, data type, sample value
- Styled to show selected state
```

#### 5. ExportPanel Component
```jsx
// Export controls
- Props: selectedCount, onExport, isDisabled
- Shows export button (disabled if no fields selected)
- Displays selected field count
```

#### 6. StatusMessage Component
```jsx
// Toast-style notifications
- Props: message, type (success/error/info), onDismiss
- Auto-dismisses after 5 seconds
- Appears at top or bottom of window
```

## User Interface Design

### Recommended Layout (React Structure)
```
┌─────────────────────────────────────────────────────────┐
│  <Header />                                      [- □ ×] │
│  FIT File Data Exporter                                  │
├─────────────────────────────────────────────────────────┤
│  <FileImport />                                          │
│  [Select FIT File]                                       │
│  Selected: /Users/username/Desktop/activity.fit         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  <FieldSelector />                                       │
│  <FieldsToolbar />                                       │
│  Available Fields (15 selected)  [Select All] [Clear]   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ <FieldsList />                                     │ │
│  │ <FieldItem /> ☑ timestamp     (datetime) 2024-... │ │
│  │ <FieldItem /> ☑ heart_rate    (uint8)    142     │ │
│  │ <FieldItem /> ☑ cadence       (uint8)    85      │ │
│  │ <FieldItem /> ☑ power         (uint16)   245     │ │
│  │ <FieldItem /> ☑ distance      (uint32)   5280.5  │ │
│  │ <FieldItem /> ☐ speed         (uint16)   5.2     │ │
│  │ <FieldItem /> ☐ altitude      (uint16)   1250.3  │ │
│  │   ...                                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  <ExportPanel />                                         │
│                                    [Export to CSV]       │
│                                                          │
│  <StatusMessage />                                       │
│  Status: Ready to export                                 │
└──────────────────────────────────────────────────────────┘
```

## Non-Functional Requirements

### Performance
- **NFR-1.1**: Application shall parse and display FIT file fields within 2 seconds for files up to 10MB
- **NFR-1.2**: CSV export shall complete within 5 seconds for files up to 10MB
- **NFR-1.3**: React UI shall remain responsive during file parsing (use async operations)

### Usability
- **NFR-2.1**: Interface shall be intuitive enough for first-time users without documentation
- **NFR-2.2**: All error messages shall be user-friendly and actionable
- **NFR-2.3**: UI transitions shall be smooth (consider loading states)

### Reliability
- **NFR-3.1**: Application shall handle corrupted FIT files gracefully without crashing
- **NFR-3.2**: Application shall validate write permissions before attempting export

### Packaging
- **NFR-4.1**: Application shall be packaged as a signed .dmg installer
- **NFR-4.2**: DMG shall include drag-to-Applications folder functionality
- **NFR-4.3**: Application bundle shall be self-contained (no external dependencies)

## Technical Implementation Notes

### Recommended NPM Packages
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "fit-file-parser": "^1.x.x",
    "papaparse": "^5.x.x",
    "electron": "^28.x.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "electron-builder": "^24.x.x",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Electron IPC Communication (Preload Script)
```javascript
// preload.js - exposes safe IPC methods to React app
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  parseFile: (filePath) => ipcRenderer.invoke('parse-file', filePath),
  exportCSV: (data, suggestedName) => ipcRenderer.invoke('export-csv', data, suggestedName)
});
```

### React State Management Pattern
```javascript
// App.jsx - main state structure
const [appState, setAppState] = useState({
  selectedFile: null,
  parsedData: null,
  availableFields: [],
  selectedFields: new Set(),
  status: { message: '', type: '' }
});
```

### Build Configuration (package.json)
```json
{
  "name": "fit-file-exporter",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "electron:dev": "electron .",
    "electron:build": "vite build && electron-builder"
  },
  "build": {
    "appId": "com.yourname.fit-exporter",
    "productName": "FIT File Data Exporter",
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "mac": {
      "category": "public.app-category.utilities",
      "target": "dmg",
      "icon": "build/icon.icns"
    },
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

## Project Structure
```
fit-exporter/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # IPC bridge (secure)
│   └── lib/
│       ├── fitParser.js     # FIT file parsing logic
│       └── csvExporter.js   # CSV generation logic
├── src/                     # React application
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles + Tailwind
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── FileImport.jsx
│   │   ├── FileInfo.jsx
│   │   ├── FieldSelector.jsx
│   │   ├── FieldsToolbar.jsx
│   │   ├── FieldsList.jsx
│   │   ├── FieldItem.jsx
│   │   ├── ExportPanel.jsx
│   │   └── StatusMessage.jsx
│   └── hooks/
│       └── useElectronAPI.js # Custom hook for IPC calls
├── public/
│   └── index.html
├── build/
│   └── icon.icns            # App icon
└── README.md
```

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.js'
    })
  ],
  base: './',
  build: {
    outDir: 'dist'
  }
});
```

## Development Phases

### Phase 1: Project Setup
1. Initialize Vite + React project
2. Install and configure Electron
3. Set up Tailwind CSS
4. Configure IPC bridge (preload.js)
5. Create basic Electron window

### Phase 2: Core React Components
1. Create component structure (all components listed above)
2. Set up state management in App.jsx
3. Build FileImport component with IPC integration
4. Create FieldSelector and child components
5. Implement ExportPanel component

### Phase 3: Electron Integration
1. Implement file selection dialog in main process
2. Implement FIT file parser in main process
3. Create IPC handlers for file operations
4. Implement CSV export with save dialog

### Phase 4: UI Polish
1. Style components with Tailwind
2. Add loading states and spinners
3. Implement StatusMessage component
4. Add hover/focus states
5. Test responsive behavior

### Phase 5: Testing & Packaging
1. Test all user workflows
2. Configure electron-builder
3. Generate DMG installer
4. Test on clean macOS installation

## React-Specific Implementation Guidelines

### State Management
- Use `useState` for component-level state
- Use `useEffect` for IPC listeners and side effects
- Consider `useCallback` for event handlers passed to child components
- Consider `useMemo` for expensive field filtering/processing

### IPC Communication Pattern
```jsx
// Example: Using IPC from React component
const handleSelectFile = async () => {
  try {
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      const parsedData = await window.electronAPI.parseFile(filePath);
      setAppState(prev => ({
        ...prev,
        selectedFile: filePath,
        parsedData: parsedData,
        availableFields: extractFields(parsedData)
      }));
    }
  } catch (error) {
    setAppState(prev => ({
      ...prev,
      status: { message: error.message, type: 'error' }
    }));
  }
};
```

### Styling Approach with Tailwind
```jsx
// Example component with Tailwind classes
const FieldItem = ({ field, isSelected, onToggle }) => (
  <div 
    className={`
      flex items-center p-3 rounded-lg cursor-pointer
      hover:bg-gray-100 transition-colors
      ${isSelected ? 'bg-blue-50 border-2 border-blue-400' : 'border border-gray-200'}
    `}
    onClick={onToggle}
  >
    <input
      type="checkbox"
      checked={isSelected}
      onChange={onToggle}
      className="mr-3 h-5 w-5"
    />
    <div className="flex-1 grid grid-cols-3 gap-4">
      <span className="font-medium">{field.name}</span>
      <span className="text-gray-600">{field.type}</span>
      <span className="text-gray-500 truncate">{field.sampleValue}</span>
    </div>
  </div>
);
```

## Testing Checklist
- [ ] Import valid FIT file successfully
- [ ] Handle invalid/corrupted FIT files
- [ ] Display all available fields correctly
- [ ] Select/deselect individual fields
- [ ] Select All/Clear All functionality works
- [ ] React state updates correctly on all interactions
- [ ] Export with at least one field selected
- [ ] Export creates valid CSV file
- [ ] CSV contains correct headers and data
- [ ] Export to different locations (Desktop, Documents, custom folder)
- [ ] File overwrite warning works
- [ ] Error messages display appropriately
- [ ] Loading states appear during async operations
- [ ] UI remains responsive during file parsing
- [ ] Window resize maintains layout integrity
- [ ] Application can be installed from DMG
- [ ] Application runs on different macOS versions (if applicable)

## Success Criteria
1. Application successfully imports any valid Garmin .FIT file
2. User can clearly see and understand available data fields
3. User can select desired fields intuitively with React UI
4. CSV export completes successfully with correct data
5. Application is packaged as a functional DMG installer
6. Application can be installed and run on multiple macOS machines
7. React UI is responsive and provides smooth user experience

---

**Notes for Cursor Implementation:**
- Use Vite + React template as starting point: `npm create vite@latest fit-exporter -- --template react`
- Electron IPC requires careful security setup with contextBridge in preload.js
- All Node.js operations (file system, FIT parsing) must occur in main process
- React app communicates with main process only through exposed IPC methods
- Consider using React DevTools for debugging component state during development
- Tailwind provides utility classes for rapid UI development without custom CSS
