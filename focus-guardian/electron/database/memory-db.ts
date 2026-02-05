// Temporary in-memory storage for testing without SQLite build issues

interface FocusSession {
  id: number;
  start_time: number;
  end_time?: number;
  planned_duration: number;
  status: string;
}

interface QueuedNotification {
  id: string;
  session_id?: number;
  app_name: string;
  title: string;
  body: string;
  sender: string;
  timestamp: number;
  is_read: number;
  is_urgent: number;
  urgency_reason?: string;
}

interface WhitelistItem {
  id: number;
  type: string;
  value: string;
}

interface Keyword {
  id: number;
  keyword: string;
}

class MemoryDatabase {
  private focusSessions: FocusSession[] = [];
  private notifications: QueuedNotification[] = [];
  private whitelist: WhitelistItem[] = [];
  private keywords: Keyword[] = [];
  private nextId = 1;

  prepare(sql: string) {
    return {
      run: (...params: any[]) => {
        if (sql.includes('INSERT INTO focus_sessions')) {
          const session: FocusSession = {
            id: this.nextId++,
            start_time: params[0],
            planned_duration: params[1],
            status: 'active'
          };
          this.focusSessions.push(session);
          return { lastInsertRowid: session.id };
        }
        if (sql.includes('UPDATE focus_sessions')) {
          const session = this.focusSessions.find(s => s.id === params[2]);
          if (session) {
            session.end_time = params[0];
            session.status = params[1];
          }
        }
        if (sql.includes('INSERT INTO queued_notifications')) {
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
        if (sql.includes('UPDATE queued_notifications')) {
          const notif = this.notifications.find(n => n.id === params[0]);
          if (notif) notif.is_read = 1;
        }
        if (sql.includes('DELETE FROM queued_notifications')) {
          this.notifications = [];
        }
        if (sql.includes('INSERT INTO whitelist')) {
          this.whitelist.push({
            id: this.nextId++,
            type: params[0],
            value: params[1]
          });
        }
        if (sql.includes('DELETE FROM whitelist')) {
          this.whitelist = this.whitelist.filter(w => w.id !== params[0]);
        }
        if (sql.includes('INSERT INTO urgent_keywords')) {
          this.keywords.push({
            id: this.nextId++,
            keyword: params[0]
          });
        }
        if (sql.includes('DELETE FROM urgent_keywords')) {
          this.keywords = this.keywords.filter(k => k.id !== params[0]);
        }
        return {};
      },
      get: (...params: any[]) => {
        if (sql.includes('FROM whitelist')) {
          return this.whitelist.find(w =>
            (w.type === 'app' && w.value === params[0]) ||
            (w.type === 'contact' && w.value === params[1])
          );
        }
        return null;
      },
      all: () => {
        if (sql.includes('FROM queued_notifications')) {
          return this.notifications;
        }
        if (sql.includes('FROM whitelist')) {
          return this.whitelist;
        }
        if (sql.includes('FROM urgent_keywords')) {
          return this.keywords;
        }
        return [];
      }
    };
  }

  exec() {}
  pragma() {}
  close() {}
}

let db: MemoryDatabase | null = null;

export function initDatabase() {
  if (!db) {
    db = new MemoryDatabase();
  }
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  db = null;
}
