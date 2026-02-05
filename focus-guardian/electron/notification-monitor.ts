import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { getDatabase } from './database/memory-db';

export interface MacNotification {
  id: string;
  appName: string;
  title: string;
  body: string;
  timestamp: number;
}

export class NotificationMonitor {
  private notificationDbPath: string;

  constructor() {
    this.notificationDbPath = path.join(
      os.homedir(),
      'Library/Application Support/NotificationCenter/db2/db'
    );
  }

  async getNotificationsDuringSession(startTime: number, endTime: number): Promise<MacNotification[]> {
    try {
      const db = new Database(this.notificationDbPath, { readonly: true });

      const notifications = db.prepare(`
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

      db.close();
      return notifications as MacNotification[];
    } catch (error) {
      console.error('Failed to read notifications:', error);
      return [];
    }
  }

  async saveNotifications(sessionId: number, notifications: MacNotification[]): Promise<void> {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO queued_notifications
      (id, session_id, app_name, title, body, sender, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const notif of notifications) {
      stmt.run(
        notif.id,
        sessionId,
        notif.appName,
        notif.title || '',
        notif.body || '',
        notif.appName,
        notif.timestamp
      );
    }
  }
}