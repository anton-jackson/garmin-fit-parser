import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createConnection } from 'net';
import { parseFITFile } from './lib/fitParser.js';
import { exportToCSV } from './lib/csvExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

// Helper function to check if a port is available (server is running)
function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: 'localhost' }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(100, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

// Find the Vite dev server port
async function findVitePort() {
  // Try common Vite ports
  const ports = [5173, 5174, 5175, 5176, 5177];
  for (const port of ports) {
    if (await isPortOpen(port)) {
      console.log(`Found Vite server on port ${port}`);
      return port;
    }
  }
  // Default to 5173 if none found
  console.warn('Could not find Vite server, defaulting to port 5173');
  return 5173;
}

async function createWindow() {
  // Use absolute path for preload script (must be .cjs for CommonJS)
  const preloadPath = resolve(__dirname, 'preload.cjs');
  console.log('Preload script path:', preloadPath);
  
  // Verify preload file exists
  if (existsSync(preloadPath)) {
    console.log('✓ Preload script file exists');
  } else {
    console.error('✗ Preload script file NOT found at:', preloadPath);
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // Disable sandbox to ensure preload works
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff'
  });

  // Listen for preload errors
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload script error:', error);
    console.error('Preload path:', preloadPath);
  });

  // Load the app
  // Default to development mode unless explicitly set to production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('isDevelopment:', isDevelopment);
  
  if (isDevelopment) {
    // Find the actual Vite dev server port
    const vitePort = await findVitePort();
    const viteUrl = `http://localhost:${vitePort}`;
    console.log(`Loading Vite dev server: ${viteUrl}`);
    
    mainWindow.loadURL(viteUrl);
    mainWindow.webContents.openDevTools();
    
    // Check if electronAPI is available after page loads
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        console.log('Page loaded. Checking electronAPI...');
        console.log('window.electronAPI:', window.electronAPI);
        console.log('Available:', !!window.electronAPI);
        if (window.electronAPI) {
          console.log('Methods:', Object.keys(window.electronAPI));
        }
      `).catch(err => console.error('Error checking electronAPI:', err));
    });
  } else {
    const distPath = join(__dirname, '../dist/index.html');
    console.log('Loading production build from:', distPath);
    mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Handle file selection
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'FIT Files', extensions: ['fit', 'FIT'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Handle file parsing
ipcMain.handle('parse-file', async (event, filePath) => {
  try {
    const fileBuffer = await readFile(filePath);
    const parsedData = await parseFITFile(fileBuffer);
    return {
      success: true,
      data: parsedData,
      filePath: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle CSV export
ipcMain.handle('export-csv', async (event, records, selectedFields, suggestedName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: suggestedName || 'export.csv',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['showOverwriteConfirmation']
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    await exportToCSV(records, selectedFields, result.filePath);
    return {
      success: true,
      filePath: result.filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
