-- PIN-based License Management Table
-- Created: 2025-01-11
-- Updated: 2025-01-23 - Simplified to PIN-based system
-- Version: 0009

-- License table - Single row with id=1
CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY,
  license_key TEXT NOT NULL,
  activated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1))
);