-- License Management Table
-- Created: 2025-01-11
-- Version: 0009

-- License table
CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hardware_id TEXT NOT NULL UNIQUE,
  license_key TEXT NOT NULL UNIQUE,
  activated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_license_hardware_id ON license(hardware_id);
CREATE INDEX IF NOT EXISTS idx_license_key ON license(license_key);

