import { BrowserWindow, app } from 'electron';
import { getDatabase } from './database/memory-db';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface FocusSession {
  id?: number;
  startTime: number;
  endTime?: number;
  plannedDuration: number;
  status: 'active' | 'completed' | 'cancelled';
  screenshotPath?: string;
  workContext?: string;
}

export class FocusManager {
  private currentSession: FocusSession | null = null;
  private timer: NodeJS.Timeout | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  async startFocus(duration: number): Promise<void> {
    if (this.currentSession) {
      throw new Error('Focus session already active');
    }

    const db = getDatabase();
    const startTime = Math.floor(Date.now() / 1000);

    const result = db.prepare(`
      INSERT INTO focus_sessions (start_time, planned_duration, status)
      VALUES (?, ?, 'active')
    `).run(startTime, duration);

    this.currentSession = {
      id: result.lastInsertRowid as number,
      startTime,
      plannedDuration: duration,
      status: 'active',
    };

    this.startTimer();
    this.notifyUpdate();
  }

  async stopFocus(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active focus session');
    }

    const db = getDatabase();
    const endTime = Math.floor(Date.now() / 1000);

    db.prepare(`
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

  private startTimer(): void {
    this.timer = setInterval(() => {
      if (!this.currentSession) return;

      const elapsed = Math.floor(Date.now() / 1000) - this.currentSession.startTime;
      const remaining = this.currentSession.plannedDuration - elapsed;

      if (remaining <= 0) {
        this.stopFocus();
      } else {
        this.notifyUpdate();
      }
    }, 1000);
  }

  getStatus() {
    if (!this.currentSession) {
      return {
        isActive: false,
        remainingTime: 0,
        plannedDuration: 0,
      };
    }

    const elapsed = Math.floor(Date.now() / 1000) - this.currentSession.startTime;
    const remaining = Math.max(0, this.currentSession.plannedDuration - elapsed);

    return {
      isActive: true,
      remainingTime: remaining,
      plannedDuration: this.currentSession.plannedDuration,
      sessionId: this.currentSession.id,
    };
  }

  private notifyUpdate(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('focus:update', this.getStatus());
    }
  }

  async captureScreenshot(): Promise<string | null> {
    try {
      const screenshotsDir = path.join(app.getPath('userData'), 'screenshots');

      // Create screenshots directory if it doesn't exist
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `focus-${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);

      // Get the frontmost window using AppleScript
      const getWindowScript = `
        tell application "System Events"
          set frontApp to first application process whose frontmost is true
          set appName to name of frontApp
          return appName
        end tell
      `;

      try {
        const { stdout: appName } = await execAsync(`osascript -e '${getWindowScript}'`);
        console.log('Capturing screenshot of active window:', appName.trim());

        // Capture the active window with a delay to ensure it's ready
        await execAsync(`screencapture -x -l$(osascript -e 'tell application "System Events" to get id of first window of (first application process whose frontmost is true)') "${filepath}"`);
      } catch (windowError) {
        // Fallback to interactive window selection if getting window ID fails
        console.log('Falling back to interactive window selection');
        await execAsync(`screencapture -x -w "${filepath}"`);
      }

      return filepath;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  async saveWorkContext(sessionId: number, screenshotPath: string | null, workContext: string): Promise<void> {
    const db = getDatabase();

    db.prepare(`
      UPDATE focus_sessions
      SET screenshot_path = ?, work_context = ?
      WHERE id = ?
    `).run(screenshotPath, workContext, sessionId);
  }

  getLastSession(): FocusSession | null {
    const db = getDatabase();

    const row = db.prepare(`
      SELECT id, start_time, end_time, planned_duration, status, screenshot_path, work_context
      FROM focus_sessions
      ORDER BY id DESC
      LIMIT 1
    `).get() as any;

    if (!row) return null;

    return {
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      plannedDuration: row.planned_duration,
      status: row.status,
      screenshotPath: row.screenshot_path,
      workContext: row.work_context,
    };
  }
}