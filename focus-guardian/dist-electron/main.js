var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { nativeImage, Tray, Menu, app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import Database from "better-sqlite3";
import os from "os";
class MemoryDatabase {
  constructor() {
    __publicField(this, "focusSessions", []);
    __publicField(this, "notifications", []);
    __publicField(this, "whitelist", []);
    __publicField(this, "keywords", []);
    __publicField(this, "nextId", 1);
  }
  prepare(sql) {
    return {
      run: (...params) => {
        if (sql.includes("INSERT INTO focus_sessions")) {
          const session = {
            id: this.nextId++,
            start_time: params[0],
            planned_duration: params[1],
            status: "active"
          };
          this.focusSessions.push(session);
          return { lastInsertRowid: session.id };
        }
        if (sql.includes("UPDATE focus_sessions")) {
          const session = this.focusSessions.find((s) => s.id === params[2]);
          if (session) {
            session.end_time = params[0];
            session.status = params[1];
          }
        }
        if (sql.includes("INSERT INTO queued_notifications")) {
          this.notifications.push({
            id: params[0],
            session_id: params[1],
            app_name: params[2],
            title: params[3],
            body: params[4],
            sender: params[5],
            timestamp: params[6],
            is_read: 0,
            is_urgent: 0
          });
        }
        if (sql.includes("UPDATE queued_notifications")) {
          const notif = this.notifications.find((n) => n.id === params[0]);
          if (notif) notif.is_read = 1;
        }
        if (sql.includes("DELETE FROM queued_notifications")) {
          this.notifications = [];
        }
        if (sql.includes("INSERT INTO whitelist")) {
          this.whitelist.push({
            id: this.nextId++,
            type: params[0],
            value: params[1]
          });
        }
        if (sql.includes("DELETE FROM whitelist")) {
          this.whitelist = this.whitelist.filter((w) => w.id !== params[0]);
        }
        if (sql.includes("INSERT INTO urgent_keywords")) {
          this.keywords.push({
            id: this.nextId++,
            keyword: params[0]
          });
        }
        if (sql.includes("DELETE FROM urgent_keywords")) {
          this.keywords = this.keywords.filter((k) => k.id !== params[0]);
        }
        return {};
      },
      get: (...params) => {
        if (sql.includes("FROM whitelist")) {
          return this.whitelist.find(
            (w) => w.type === "app" && w.value === params[0] || w.type === "contact" && w.value === params[1]
          );
        }
        return null;
      },
      all: () => {
        if (sql.includes("FROM queued_notifications")) {
          return this.notifications;
        }
        if (sql.includes("FROM whitelist")) {
          return this.whitelist;
        }
        if (sql.includes("FROM urgent_keywords")) {
          return this.keywords;
        }
        return [];
      }
    };
  }
  exec() {
  }
  pragma() {
  }
  close() {
  }
}
let db = null;
function initDatabase() {
  if (!db) {
    db = new MemoryDatabase();
  }
  return db;
}
function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
function closeDatabase() {
  db = null;
}
class FocusManager {
  constructor(mainWindow2) {
    __publicField(this, "currentSession", null);
    __publicField(this, "timer", null);
    __publicField(this, "mainWindow", null);
    this.mainWindow = mainWindow2;
  }
  async startFocus(duration) {
    if (this.currentSession) {
      throw new Error("Focus session already active");
    }
    const db2 = getDatabase();
    const startTime = Math.floor(Date.now() / 1e3);
    const result = db2.prepare(`
      INSERT INTO focus_sessions (start_time, planned_duration, status)
      VALUES (?, ?, 'active')
    `).run(startTime, duration);
    this.currentSession = {
      id: result.lastInsertRowid,
      startTime,
      plannedDuration: duration,
      status: "active"
    };
    this.startTimer();
    this.notifyUpdate();
  }
  async stopFocus() {
    if (!this.currentSession) {
      throw new Error("No active focus session");
    }
    const db2 = getDatabase();
    const endTime = Math.floor(Date.now() / 1e3);
    db2.prepare(`
      UPDATE focus_sessions
      SET end_time = ?, status = 'completed'
      WHERE id = ?
    `).run(endTime, this.currentSession.id);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.currentSession = null;
    this.notifyUpdate();
  }
  startTimer() {
    this.timer = setInterval(() => {
      if (!this.currentSession) return;
      const elapsed = Math.floor(Date.now() / 1e3) - this.currentSession.startTime;
      const remaining = this.currentSession.plannedDuration - elapsed;
      if (remaining <= 0) {
        this.stopFocus();
      } else {
        this.notifyUpdate();
      }
    }, 1e3);
  }
  getStatus() {
    if (!this.currentSession) {
      return {
        isActive: false,
        remainingTime: 0,
        plannedDuration: 0
      };
    }
    const elapsed = Math.floor(Date.now() / 1e3) - this.currentSession.startTime;
    const remaining = Math.max(0, this.currentSession.plannedDuration - elapsed);
    return {
      isActive: true,
      remainingTime: remaining,
      plannedDuration: this.currentSession.plannedDuration,
      sessionId: this.currentSession.id
    };
  }
  notifyUpdate() {
    if (this.mainWindow) {
      this.mainWindow.webContents.send("focus:update", this.getStatus());
    }
  }
}
const execAsync = promisify(exec);
class DNDController {
  constructor() {
    __publicField(this, "previousDNDState", false);
    __publicField(this, "focusModeName", "工作");
  }
  setFocusModeName(name) {
    this.focusModeName = name;
    console.log("Focus mode name set to:", name);
  }
  async enableDND() {
    console.log(`Attempting to enable Focus mode: ${this.focusModeName}`);
    try {
      const shortcutScript = `
        tell application "System Events"
          tell process "ControlCenter"
            -- Try to activate the focus mode
            -- This is a simplified approach
            keystroke "${this.focusModeName}"
          end tell
        end tell
      `;
      await execAsync(`osascript -e '${shortcutScript}'`);
      console.log("Focus mode enabled successfully");
    } catch (error) {
      console.error("Failed to enable Focus mode:", error);
      console.log("Please manually enable Focus mode:", this.focusModeName);
      console.log("You can do this from Control Center in the menu bar");
    }
  }
  async disableDND() {
    console.log("Automatic DND control is disabled. Please manually disable DND if needed.");
  }
  async getDNDState() {
    try {
      const script = `
        tell application "System Events"
          tell process "ControlCenter"
            return value of checkbox 1 of group 1 of window "Control Center"
          end tell
        end tell
      `;
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      return stdout.trim() === "1";
    } catch (error) {
      console.error("Failed to get DND state:", error);
      return false;
    }
  }
}
class NotificationMonitor {
  constructor() {
    __publicField(this, "notificationDbPath");
    this.notificationDbPath = path.join(
      os.homedir(),
      "Library/Application Support/NotificationCenter/db2/db"
    );
  }
  async getNotificationsDuringSession(startTime, endTime) {
    try {
      const db2 = new Database(this.notificationDbPath, { readonly: true });
      const notifications = db2.prepare(`
        SELECT
          data as id,
          app as appName,
          title,
          body,
          delivered_date as timestamp
        FROM record
        WHERE delivered_date BETWEEN ? AND ?
        ORDER BY delivered_date DESC
        LIMIT 100
      `).all(startTime, endTime);
      db2.close();
      return notifications;
    } catch (error) {
      console.error("Failed to read notifications:", error);
      return [];
    }
  }
  async saveNotifications(sessionId, notifications) {
    const db2 = getDatabase();
    const stmt = db2.prepare(`
      INSERT OR IGNORE INTO queued_notifications
      (id, session_id, app_name, title, body, sender, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const notif of notifications) {
      stmt.run(
        notif.id,
        sessionId,
        notif.appName,
        notif.title || "",
        notif.body || "",
        notif.appName,
        notif.timestamp
      );
    }
  }
}
const __filename$2 = fileURLToPath(import.meta.url);
const __dirname$2 = path.dirname(__filename$2);
class TrayManager {
  constructor() {
    __publicField(this, "tray", null);
    __publicField(this, "trayWindow", null);
    this.createTray();
  }
  createTray() {
    const iconPath = path.join(__dirname$2, "../resources/tray-icon.png");
    const icon = nativeImage.createFromPath(iconPath);
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip("Focus Guardian");
    this.tray.on("click", () => {
      this.toggleWindow();
    });
    this.createMenu();
  }
  createMenu() {
    var _a;
    const menu = Menu.buildFromTemplate([
      { label: "开始专注", click: () => this.toggleWindow() },
      { label: "查看通知队列", click: () => this.showQueueWindow() },
      { type: "separator" },
      { label: "设置", click: () => this.showSettings() },
      { label: "退出", click: () => app.quit() }
    ]);
    (_a = this.tray) == null ? void 0 : _a.setContextMenu(menu);
  }
  toggleWindow() {
    if (this.trayWindow && !this.trayWindow.isDestroyed()) {
      if (this.trayWindow.isVisible()) {
        this.trayWindow.hide();
      } else {
        this.showTrayWindow();
      }
    } else {
      this.createTrayWindow();
      this.showTrayWindow();
    }
  }
  createTrayWindow() {
    this.trayWindow = new BrowserWindow({
      width: 320,
      height: 400,
      show: false,
      frame: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname$2, "preload.js"),
        contextIsolation: true
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      this.trayWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/tray`);
    } else {
      this.trayWindow.loadFile(path.join(__dirname$2, "../dist/index.html"), { hash: "/tray" });
    }
  }
  showTrayWindow() {
    if (!this.trayWindow || !this.tray) return;
    const bounds = this.tray.getBounds();
    const x = Math.round(bounds.x + bounds.width / 2 - 160);
    const y = Math.round(bounds.y + bounds.height);
    this.trayWindow.setPosition(x, y);
    this.trayWindow.show();
  }
  updateIcon(isFocusing) {
    if (!this.tray) return;
    const iconName = isFocusing ? "tray-icon-focus.png" : "tray-icon.png";
    const iconPath = path.join(__dirname$2, "../resources", iconName);
    const icon = nativeImage.createFromPath(iconPath);
    this.tray.setImage(icon.resize({ width: 16, height: 16 }));
  }
  showQueueWindow() {
    console.log("Show queue window");
  }
  showSettings() {
    console.log("Show settings");
  }
}
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
globalThis.__filename = __filename$1;
globalThis.__dirname = __dirname$1;
let mainWindow = null;
let focusManager = null;
let dndController = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: true,
    frame: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
app.whenReady().then(() => {
  initDatabase();
  createWindow();
  if (mainWindow) {
    focusManager = new FocusManager(mainWindow);
    dndController = new DNDController();
    new NotificationMonitor();
    new TrayManager();
  }
  setupIpcHandlers();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  closeDatabase();
});
function setupIpcHandlers() {
  ipcMain.handle("focus:start", async (_event, duration) => {
    if (focusManager && dndController) {
      await dndController.enableDND();
      await focusManager.startFocus(duration);
    }
  });
  ipcMain.handle("focus:stop", async () => {
    if (focusManager && dndController) {
      await focusManager.stopFocus();
      await dndController.disableDND();
    }
  });
  ipcMain.handle("focus:status", () => {
    return (focusManager == null ? void 0 : focusManager.getStatus()) || { isActive: false, remainingTime: 0, plannedDuration: 0 };
  });
  ipcMain.handle("notifications:get", async () => {
    const db2 = require("./database/db").getDatabase();
    return db2.prepare("SELECT * FROM queued_notifications ORDER BY timestamp DESC").all();
  });
  ipcMain.handle("notifications:markRead", async (_event, id) => {
    const db2 = require("./database/db").getDatabase();
    db2.prepare("UPDATE queued_notifications SET is_read = 1 WHERE id = ?").run(id);
  });
  ipcMain.handle("notifications:clear", async () => {
    const db2 = require("./database/db").getDatabase();
    db2.prepare("DELETE FROM queued_notifications").run();
  });
  ipcMain.handle("settings:getWhitelist", async () => {
    const db2 = require("./database/db").getDatabase();
    return db2.prepare("SELECT * FROM whitelist").all();
  });
  ipcMain.handle("settings:addWhitelist", async (_event, type, value) => {
    const db2 = require("./database/db").getDatabase();
    db2.prepare("INSERT INTO whitelist (type, value) VALUES (?, ?)").run(type, value);
  });
  ipcMain.handle("settings:removeWhitelist", async (_event, id) => {
    const db2 = require("./database/db").getDatabase();
    db2.prepare("DELETE FROM whitelist WHERE id = ?").run(id);
  });
  ipcMain.handle("settings:getKeywords", async () => {
    const db2 = require("./database/db").getDatabase();
    return db2.prepare("SELECT * FROM urgent_keywords").all();
  });
  ipcMain.handle("settings:addKeyword", async (_event, keyword) => {
    const db2 = require("./database/db").getDatabase();
    db2.prepare("INSERT INTO urgent_keywords (keyword) VALUES (?)").run(keyword);
  });
  ipcMain.handle("settings:removeKeyword", async (_event, id) => {
    const db2 = require("./database/db").getDatabase();
    db2.prepare("DELETE FROM urgent_keywords WHERE id = ?").run(id);
  });
  ipcMain.handle("settings:saveFocusModeName", async (_event, name) => {
    const db2 = require("./database/memory-db").getDatabase();
    db2.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("focus_mode_name", name);
    if (dndController) {
      dndController.setFocusModeName(name);
    }
  });
  ipcMain.handle("settings:getFocusModeName", async () => {
    const db2 = require("./database/memory-db").getDatabase();
    const result = db2.prepare("SELECT value FROM settings WHERE key = ?").get("focus_mode_name");
    return (result == null ? void 0 : result.value) || "工作";
  });
}
