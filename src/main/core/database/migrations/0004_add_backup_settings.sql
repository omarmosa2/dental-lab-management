-- Add backup settings columns
-- Created: 2025-01-10
-- Version: 0003

-- Add backup_interval_hours column
ALTER TABLE settings ADD COLUMN backup_interval_hours INTEGER NOT NULL DEFAULT 24;

-- Add backup_directory column
ALTER TABLE settings ADD COLUMN backup_directory TEXT NOT NULL DEFAULT '';