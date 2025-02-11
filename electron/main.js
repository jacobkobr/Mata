const { app, BrowserWindow, ipcMain, protocol, globalShortcut } = require('electron');
const path = require('path');
const storage = require('./storage');
const fs = require('fs');
const { URL } = require('url');
const os = require('os');
const si = require('systeminformation');

// Development mode check using app.isPackaged
const isDev = !app.isPackaged;

// Enable debug logging
const DEBUG = isDev;
function debugLog(...args) {
  if (DEBUG) {
    console.log('[Mata Debug]:', ...args);
  }
}

// Window management
let mainWindow = null;
let compactWindow = null;
let isCompactMode = false;

// System monitoring
let monitoringInterval;

async function getSystemInfo() {
  try {
    const [cpu, mem, graphics] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.graphics()
    ]);

    const gpuInfo = graphics.controllers[0] || null;

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        physicalCores: cpu.physicalCores,
        cores: cpu.cores,
        speed: cpu.speed,
        speedMax: cpu.speedMax,
        architecture: os.arch(),
        instructions: {
          avx: cpu.flags?.includes('avx') || false,
          avx2: cpu.flags?.includes('avx2') || false,
        }
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.used,
        active: mem.active,
        available: mem.available,
      },
      gpu: gpuInfo ? {
        vendor: gpuInfo.vendor,
        model: gpuInfo.model,
        vram: gpuInfo.vram,
        driverVersion: gpuInfo.driverVersion,
        cuda: gpuInfo.vendor.toLowerCase().includes('nvidia'),
      } : null
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return null;
  }
}

async function getResourceUsage() {
  try {
    const [currentLoad, mem, gpuLoad] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.graphics()
    ]);

    return {
      cpu: {
        load: currentLoad.currentLoad,
        loadPerCore: currentLoad.cpus.map(cpu => cpu.load),
      },
      memory: {
        used: mem.used,
        active: mem.active,
        available: mem.available,
      },
      gpu: gpuLoad.controllers[0] ? {
        load: gpuLoad.controllers[0].utilizationGpu || 0,
        memoryUsed: gpuLoad.controllers[0].memoryUsed || 0,
        memoryTotal: gpuLoad.controllers[0].memoryTotal || 0,
      } : null
    };
  } catch (error) {
    console.error('Error getting resource usage:', error);
    return null;
  }
}

function startMonitoring(window) {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  // Initial system info
  getSystemInfo().then(info => {
    if (!window.isDestroyed()) {
      window.webContents.send('system-info', info);
    }
  });

  // Resource usage monitoring
  monitoringInterval = setInterval(async () => {
    if (!window.isDestroyed()) {
      const usage = await getResourceUsage();
      if (usage) {
        window.webContents.send('resource-usage', usage);
      }
    }
  }, 1000);
}

function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// Get the app path
const getAppPath = () => {
  if (isDev) {
    return path.join(__dirname, '..');
  }
  return path.join(process.resourcesPath, 'app');
};

// Get the icon path
const getIconPath = () => {
  if (isDev) {
    return path.join(__dirname, '..', 'public', 'icons', 'mata.ico');
  }
  return path.join(process.resourcesPath, 'public', 'icons', 'mata.ico');
};

// Initialize all IPC handlers
function initializeIpcHandlers() {
  // Storage IPC handlers
  ipcMain.handle('get-all-chats', () => storage.getAllChats());
  ipcMain.handle('create-chat', (event, chat) => storage.createChat(chat));
  ipcMain.handle('update-chat', (event, chat) => storage.updateChat(chat));
  ipcMain.handle('delete-chat', (event, chatId) => storage.deleteChat(chatId));
  ipcMain.handle('get-chat-messages', (event, chatId) => storage.getChatMessages(chatId));
  ipcMain.handle('add-message', (event, message) => storage.addMessage(message));

  // System monitoring handlers
  ipcMain.handle('get-system-info', async () => {
    const info = await getSystemInfo();
    if (!info) throw new Error('Failed to get system information');
    return info;
  });

  ipcMain.handle('start-monitoring', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) throw new Error('Window not found');
    startMonitoring(window);
    return true;
  });

  ipcMain.handle('stop-monitoring', () => {
    stopMonitoring();
    return true;
  });

  // Window control handlers
  ipcMain.handle('minimize-window', () => {
    if (!mainWindow) return false;
    mainWindow.minimize();
    return true;
  });

  ipcMain.handle('maximize-window', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  });

  ipcMain.handle('close-window', () => {
    if (!mainWindow) return false;
    mainWindow.close();
    return true;
  });

  // Window management handlers
  ipcMain.handle('toggle-compact-mode', () => {
    isCompactMode = !isCompactMode;
    if (isCompactMode) {
      if (compactWindow) {
        compactWindow.show();
        compactWindow.focus();
      } else {
        createCompactWindow();
      }
      if (mainWindow) {
        mainWindow.hide();
      }
    } else {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      } else {
        createMainWindow();
      }
      if (compactWindow) {
        compactWindow.hide();
      }
    }
    return isCompactMode;
  });

  ipcMain.handle('get-window-mode', () => {
    return isCompactMode;
  });
}

function createCompactWindow() {
  if (compactWindow) {
    if (!compactWindow.isDestroyed()) {
      compactWindow.focus();
      return compactWindow;
    }
  }

  debugLog('Creating compact window...');
  
  const display = require('electron').screen.getPrimaryDisplay();
  const width = 600;
  const height = 500;
  
  compactWindow = new BrowserWindow({
    width,
    height,
    x: (display.workArea.width - width) / 2,
    y: 100, // Position from top
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    // Set initial background color with transparency
    backgroundColor: '#00000000',
  });

  compactWindow.setVisibleOnAllWorkspaces(true);
  
  if (isDev) {
    compactWindow.loadURL('http://localhost:3000?compact=true');
    compactWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    loadProductionBuild(compactWindow, true);
  }

  compactWindow.on('closed', () => {
    compactWindow = null;
    isCompactMode = false;
  });

  compactWindow.on('blur', () => {
    if (!isCompactMode) {
      compactWindow.hide();
    }
  });

  return compactWindow;
}

function createMainWindow() {
  if (mainWindow) {
    if (!mainWindow.isDestroyed()) {
      mainWindow.focus();
      return mainWindow;
    }
  }

  debugLog('Creating main window...');
  
  const iconPath = getIconPath();
  debugLog('Icon path:', iconPath);
  debugLog('Icon exists:', fs.existsSync(iconPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    show: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    backgroundColor: '#1a1a1a',
  });

  // Set taskbar icon explicitly for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.execPath);
    mainWindow.setIcon(iconPath);
  }

  // Window state change listeners
  mainWindow.on('maximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized', false);
    }
  });

  mainWindow.once('ready-to-show', () => {
    debugLog('Window ready to show');
    mainWindow.show();
    startMonitoring(mainWindow);
  });

  mainWindow.on('closed', () => {
    stopMonitoring();
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
    
    mainWindow.webContents.on('did-fail-load', () => {
      debugLog('Failed to load dev server, retrying in 1s...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL('http://localhost:3000');
        }
      }, 1000);
    });
  } else {
    loadProductionBuild(mainWindow, false);
  }

  return mainWindow;
}

function loadProductionBuild(window, isCompact) {
  try {
    debugLog('Loading production build...');
    const appPath = getAppPath();
    const indexPath = path.join(appPath, 'index.html');
    
    debugLog('Index path:', indexPath);
    debugLog('Index exists:', fs.existsSync(indexPath));

    if (!protocol.isProtocolRegistered('local')) {
      protocol.registerFileProtocol('local', (request, callback) => {
        const url = new URL(request.url);
        const filePath = path.join(appPath, decodeURIComponent(url.pathname));
        debugLog('Serving local file:', filePath);
        callback({ path: filePath });
      });
    }

    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    const modifiedHtml = htmlContent
      .replace(/src="http:\/\/localhost\/_next/g, 'src="local:/_next')
      .replace(/href="http:\/\/localhost\/_next/g, 'href="local:/_next')
      .replace(/src="http:\/\/localhost\/favicon/g, 'src="local:/favicon')
      .replace(/href="http:\/\/localhost\/favicon/g, 'href="local:/favicon')
      .replace(/src="http:\/\/localhost\/icons/g, 'src="local:/icons')
      .replace(/href="http:\/\/localhost\/icons/g, 'href="local:/icons');

    // Add compact mode query parameter
    const finalHtml = isCompact 
      ? modifiedHtml.replace('<head>', '<head><script>window.isCompactMode = true;</script>')
      : modifiedHtml;

    const tempIndexPath = path.join(app.getPath('temp'), `mata-index${isCompact ? '-compact' : ''}.html`);
    fs.writeFileSync(tempIndexPath, finalHtml);
    debugLog('Created temp index at:', tempIndexPath);

    window.loadFile(tempIndexPath);
  } catch (error) {
    console.error('Error loading production build:', error);
    throw error;
  }
}

// Register global shortcuts
function registerShortcuts() {
  // Unregister existing shortcuts
  globalShortcut.unregisterAll();

  // Register the toggle shortcut (Ctrl+Shift+M)
  const success = globalShortcut.register('CommandOrControl+Shift+M', async () => {
    debugLog('Toggle shortcut pressed');
    isCompactMode = !isCompactMode;
    if (isCompactMode) {
      if (compactWindow) {
        compactWindow.show();
        compactWindow.focus();
      } else {
        createCompactWindow();
      }
      if (mainWindow) {
        mainWindow.hide();
      }
    } else {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      } else {
        createMainWindow();
      }
      if (compactWindow) {
        compactWindow.hide();
      }
    }
  });

  if (!success) {
    console.error('Failed to register global shortcut');
  }
}

// App lifecycle
app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  app.isQuiting = true;
});

app.on('window-all-closed', () => {
  debugLog('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Initialize app
app.whenReady()
  .then(() => {
    debugLog('App ready, initializing...');
    initializeIpcHandlers();
    registerShortcuts();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((error) => {
    console.error('Error during app initialization:', error);
    app.exit(1);
  });

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
}); 