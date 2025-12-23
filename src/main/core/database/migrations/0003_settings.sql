-- Settings table for application configuration
-- Created: 2025-01-09
-- Version: 0002

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id = 1), -- Only one row allowed
  app_name TEXT NOT NULL DEFAULT 'نظام إدارة مختبر الأسنان',
  theme TEXT NOT NULL DEFAULT 'light' CHECK(theme IN ('light', 'dark')),
  auto_backup INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
  notifications INTEGER NOT NULL DEFAULT 1, -- 0 = false, 1 = true
  last_backup_date INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Insert default settings
INSERT OR IGNORE INTO settings (id, app_name, theme, auto_backup, notifications)
VALUES (1, 'نظام إدارة مختبر الأسنان', 'light', 0, 1);

-- Backups table to track backup history
CREATE TABLE IF NOT EXISTS backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  size INTEGER NOT NULL, -- in bytes
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);