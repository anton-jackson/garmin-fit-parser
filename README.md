# FIT File Data Exporter

A desktop macOS application that allows users to import Garmin .FIT files, inspect available data fields, select desired fields for export, and save the data as a CSV file.

## Download

Download the latest release from the [Releases](https://github.com/anton-jackson/garmin-fit-parser/releases) page.

**Note**: On first launch, macOS may show a security warning because the app is not code-signed. To open it:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the security dialog

## Features

- **Import FIT Files**: Native macOS file picker for selecting Garmin FIT files
- **Field Discovery**: Automatically parses and displays all available data fields from records, laps, sessions, and activity data
- **Lap Data Support**: Extracts and displays lap summary data (prefixed with `lap_`) when available in FIT files
- **Field Selection**: Select/deselect individual fields or use Select All/Clear All
- **CSV Export**: Export selected fields to CSV with customizable save location
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Technology Stack

- **Electron**: Desktop application framework
- **React**: UI library with modern hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **fit-file-parser**: FIT file parsing library
- **papaparse**: CSV generation library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anton-jackson/garmin-fit-parser.git
cd garmin-fit-parser
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the application in development mode:

```bash
npm run electron:dev
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Launch Electron with hot-reload enabled
- Open DevTools automatically

### Building

Build the React application for production:

```bash
npm run build
```

Create a distributable macOS DMG package:

```bash
npm run electron:build
```

**Build Output:**
- **DMG Installer**: `dist/FIT File Data Exporter-1.0.0-arm64.dmg` - Double-click to install
- **App Bundle**: `dist/mac-arm64/FIT File Data Exporter.app` - The actual application

The DMG file can be distributed to users. When opened, it will show the app with a link to drag to the Applications folder.

**Note**: The app is not code-signed by default. For distribution outside the Mac App Store, you'll need to sign it with a Developer ID certificate.

## Project Structure

```
fit-exporter/
├── electron/              # Electron main process
│   ├── main.js           # Main Electron process
│   ├── preload.cjs       # IPC bridge (secure, CommonJS)
│   └── lib/
│       ├── fitParser.js  # FIT file parsing logic
│       └── csvExporter.js # CSV generation logic
├── src/                  # React application
│   ├── App.jsx           # Main React component
│   ├── main.jsx          # React entry point
│   ├── index.css         # Global styles + Tailwind
│   ├── components/       # React components
│   └── hooks/            # Custom React hooks
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Usage

1. **Import a FIT File**: Click "Select FIT File" and choose a Garmin FIT file
2. **Review Fields**: All available data fields will be displayed with their types and sample values
   - Record fields: Time-series data points (e.g., `timestamp`, `heart_rate`, `power`, `cadence`)
   - Lap fields: Lap summary data (prefixed with `lap_`, e.g., `lap_total_elapsed_time`, `lap_avg_heart_rate`)
   - Session and activity data are also extracted when available
3. **Select Fields**: Check the boxes next to fields you want to export, or use "Select All"
4. **Export**: Click "Export to CSV" and choose where to save the file

## Development Notes

- All Node.js operations (file system, FIT parsing) occur in the Electron main process
- React app communicates with main process through IPC (Inter-Process Communication)
- The preload script provides a secure bridge between renderer and main process
- Tailwind CSS provides utility classes for rapid UI development

## License

MIT
