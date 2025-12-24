-- Hardware-Bound License System
-- Created: 2025-01-23
-- Version: 0010
-- Purpose: Replace PIN-based system with hardware-bound licensing

-- Drop old license table if exists
DROP TABLE IF EXISTS license;

-- Create new license table with hardware binding
CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  hardware_id TEXT NOT NULL,
  license_key TEXT NOT NULL,
  activated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1))
);

-- Create index for faster hardware_id lookups
CREATE INDEX IF NOT EXISTS idx_license_hardware_id ON license(hardware_id);