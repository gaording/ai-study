import { app, BrowserWindow, ipcMain, shell, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase, getDatabase } from './database/memory-db';
import { FocusManager } from './focus-manager';
import { DNDController } from './dnd-controller';
import { NotificationMonitor } from './notification-monitor';
import { RuleEngine } from './rule-engine';
import { TrayManager } from './tray';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make available globally for dependencies that expect CommonJS
(globalThis as any).__filename = __filename;
(globalThis as any).__dirname = __dirname;

let mainWindow: BrowserWindow | null = null;
let focusManager: FocusManager | null = null;
let dndController: DNDController | null = null;
let _notificationMonitor: NotificationMonitor | null = null;
let _ruleEngine: RuleEngine | null = null;
let _trayManager: TrayManager | null = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = 300;
  const windowHeight = 200;
  const margin = 20;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth - margin,
    y: screenHeight - windowHeight - margin,
    show: true,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Disable DevTools for small floating window
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  if (mainWindow) {
    focusManager = new FocusManager(mainWindow);
    dndController = new DNDController();
    _notificationMonitor = new NotificationMonitor();
    _ruleEngine = new RuleEngine();
    _trayManager = new TrayManager();

    // Mark as intentionally unused
    void _notificationMonitor;
    void _ruleEngine;
    void _trayManager;
  }

  setupIpcHandlers();

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

app.on('before-quit', () => {
  closeDatabase();
});

function setupIpcHandlers() {
  // Focus handlers
  ipcMain.handle('focus:start', async (_event, duration: number) => {
    if (focusManager && dndController) {
      await dndController.enableDND();
      await focusManager.startFocus(duration);
    }
  });

  ipcMain.handle('focus:stop', async () => {
    if (focusManager && dndController) {
      await focusManager.stopFocus();
      await dndController.disableDND();
    }
  });

  ipcMain.handle('focus:status', () => {
    return focusManager?.getStatus() || { isActive: false, remainingTime: 0, plannedDuration: 0 };
  });

  ipcMain.handle('focus:captureScreenshot', async () => {
    if (focusManager) {
      return await focusManager.captureScreenshot();
    }
    return null;
  });

  ipcMain.handle('focus:saveWorkContext', async (_event, sessionId: number, screenshotPath: string | null, workContext: string) => {
    if (focusManager) {
      await focusManager.saveWorkContext(sessionId, screenshotPath, workContext);
    }
  });

  ipcMain.handle('focus:getLastSession', async () => {
    if (focusManager) {
      return focusManager.getLastSession();
    }
    return null;
  });

  ipcMain.handle('focus:getHistory', async () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM focus_sessions ORDER BY id DESC').all();
  });

  // Notification handlers
  ipcMain.handle('notifications:get', async () => {
    const db = require('./database/db').getDatabase();
    return db.prepare('SELECT * FROM queued_notifications ORDER BY timestamp DESC').all();
  });

  ipcMain.handle('notifications:markRead', async (_event, id: string) => {
    const db = require('./database/db').getDatabase();
    db.prepare('UPDATE queued_notifications SET is_read = 1 WHERE id = ?').run(id);
  });

  ipcMain.handle('notifications:clear', async () => {
    const db = require('./database/db').getDatabase();
    db.prepare('DELETE FROM queued_notifications').run();
  });

  // Settings handlers - Whitelist
  ipcMain.handle('settings:getWhitelist', async () => {
    const db = require('./database/db').getDatabase();
    return db.prepare('SELECT * FROM whitelist').all();
  });

  ipcMain.handle('settings:addWhitelist', async (_event, type: string, value: string) => {
    const db = require('./database/db').getDatabase();
    db.prepare('INSERT INTO whitelist (type, value) VALUES (?, ?)').run(type, value);
  });

  ipcMain.handle('settings:removeWhitelist', async (_event, id: number) => {
    const db = require('./database/db').getDatabase();
    db.prepare('DELETE FROM whitelist WHERE id = ?').run(id);
  });

  // Settings handlers - Keywords
  ipcMain.handle('settings:getKeywords', async () => {
    const db = require('./database/db').getDatabase();
    return db.prepare('SELECT * FROM urgent_keywords').all();
  });

  ipcMain.handle('settings:addKeyword', async (_event, keyword: string) => {
    const db = require('./database/db').getDatabase();
    db.prepare('INSERT INTO urgent_keywords (keyword) VALUES (?)').run(keyword);
  });

  ipcMain.handle('settings:removeKeyword', async (_event, id: number) => {
    const db = require('./database/db').getDatabase();
    db.prepare('DELETE FROM urgent_keywords WHERE id = ?').run(id);
  });

  // Settings handlers - Focus Mode
  ipcMain.handle('settings:saveFocusModeName', async (_event, name: string) => {
    const db = require('./database/memory-db').getDatabase();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('focus_mode_name', name);
    // Update DNDController with new focus mode name
    if (dndController) {
      dndController.setFocusModeName(name);
    }
  });

  ipcMain.handle('settings:getFocusModeName', async () => {
    const db = require('./database/memory-db').getDatabase();
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get('focus_mode_name');
    return result?.value || '工作';
  });

  // Shell handlers
  ipcMain.handle('shell:openPath', async (_event, path: string) => {
    return await shell.openPath(path);
  });
}
