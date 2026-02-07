-- Focus sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  planned_duration INTEGER NOT NULL,
  status TEXT CHECK(status IN ('active', 'completed', 'cancelled')),
  screenshot_path TEXT,
  work_context TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Queued notifications table
CREATE TABLE IF NOT EXISTS queued_notifications (
  id TEXT PRIMARY KEY,
  session_id INTEGER,
  app_name TEXT NOT NULL,
  title TEXT,
  body TEXT,
  sender TEXT,
  timestamp INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0,
  is_urgent INTEGER DEFAULT 0,
  urgency_reason TEXT,
  FOREIGN KEY (session_id) REFERENCES focus_sessions(id)
);

-- Whitelist table
CREATE TABLE IF NOT EXISTS whitelist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('contact', 'app')) NOT NULL,
  value TEXT NOT NULL UNIQUE,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Urgent keywords table
CREATE TABLE IF NOT EXISTS urgent_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
