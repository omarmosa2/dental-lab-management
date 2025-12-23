-- Migration 0003: Make case_types optional in dentists table
-- Created: 2025-01-09
-- Description: Allow case_types to be NULL since it's optional

-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
CREATE TABLE dentists_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
  residence TEXT NOT NULL,
  phone TEXT NOT NULL,
  clinic_name TEXT,
  specialization TEXT,
  case_types TEXT, -- Changed from NOT NULL to allow NULL
  payment_terms TEXT DEFAULT 'immediate',
  discount_rate REAL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Copy data from old table
INSERT INTO dentists_new (id, name, gender, residence, phone, clinic_name, specialization, case_types, payment_terms, discount_rate, cost, notes, created_at, updated_at)
SELECT id, name, gender, residence, phone, clinic_name, specialization, case_types, payment_terms, discount_rate, cost, notes, created_at, updated_at
FROM dentists;

-- Drop old table and rename new one
DROP TABLE dentists;
ALTER TABLE dentists_new RENAME TO dentists;