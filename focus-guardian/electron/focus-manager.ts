import { BrowserWindow } from 'electron';
import { getDatabase } from './database/memory-db';

export interface FocusSession {
  id?: number;
  startTime: number;
  endTime?: number;
  plannedDuration: number;
  status: 'active' | 'completed' | 'cancelled';
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
}