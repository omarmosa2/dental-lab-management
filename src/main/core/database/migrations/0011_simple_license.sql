-- Simple License System using Machine GUID
-- Created: 2025-12-24
-- Version: 0011
-- Purpose: Simplified licensing system using Windows Machine GUID

-- Drop old license table if exists
DROP TABLE IF EXISTS license;

-- Create new simple license table
CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  machine_id TEXT NOT NULL,
  license_key TEXT NOT NULL,
  activated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1))
);

-- Create index for faster machine_id lookups
CREATE INDEX IF NOT EXISTS idx_license_machine_id ON license(machine_id);