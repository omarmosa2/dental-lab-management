-- Migration 0002: Enhance Database Schema
-- Created: 2025-01-09
-- Description: Remove illogical fields and add professional dental lab management fields

-- ============================================================================
-- 1. DENTISTS TABLE ENHANCEMENTS
-- ============================================================================

-- Remove color_options column (illogical for dentist data)
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
CREATE TABLE dentists_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
  residence TEXT NOT NULL,
  phone TEXT NOT NULL,
  clinic_name TEXT,
  specialization TEXT,
  case_types TEXT NOT NULL, -- JSON array - preferred case types
  payment_terms TEXT DEFAULT 'immediate', -- immediate, 7_days, 15_days, 30_days
  discount_rate REAL DEFAULT 0, -- Permanent discount percentage
  cost REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Copy data from old table (excluding color_options)
INSERT INTO dentists_new (id, name, gender, residence, phone, case_types, cost, notes, created_at, updated_at)
SELECT id, name, gender, residence, phone, case_types, cost, notes, created_at, updated_at
FROM dentists;

-- Drop old table and rename new one
DROP TABLE dentists;
ALTER TABLE dentists_new RENAME TO dentists;

-- ============================================================================
-- 2. ORDERS TABLE ENHANCEMENTS
-- ============================================================================

-- Add new fields to orders table
ALTER TABLE orders ADD COLUMN urgency_level TEXT DEFAULT 'normal' CHECK(urgency_level IN ('normal', 'urgent', 'emergency'));
ALTER TABLE orders ADD COLUMN warranty_period INTEGER DEFAULT 0; -- in days
ALTER TABLE orders ADD COLUMN revision_count INTEGER DEFAULT 0; -- number of revisions/remakes
ALTER TABLE orders ADD COLUMN try_in_date INTEGER; -- date for try-in appointment
ALTER TABLE orders ADD COLUMN remake_reason TEXT; -- reason if this is a remake
ALTER TABLE orders ADD COLUMN photos TEXT; -- JSON array of photo paths
ALTER TABLE orders ADD COLUMN prescription_file TEXT; -- path to prescription file

-- ============================================================================
-- 3. MATERIALS TABLE ENHANCEMENTS
-- ============================================================================

-- Add new fields to materials table
ALTER TABLE materials ADD COLUMN supplier TEXT; -- supplier name
ALTER TABLE materials ADD COLUMN last_purchase_date INTEGER; -- last purchase timestamp
ALTER TABLE materials ADD COLUMN expiry_date INTEGER; -- expiry timestamp for perishable materials
ALTER TABLE materials ADD COLUMN category TEXT; -- material category

-- ============================================================================
-- 4. WORKERS TABLE ENHANCEMENTS
-- ============================================================================

-- Add new fields to workers table
ALTER TABLE workers ADD COLUMN specialization TEXT; -- ceramic, metal, orthodontics, etc.
ALTER TABLE workers ADD COLUMN performance_rating REAL DEFAULT 0; -- 0-5 rating
ALTER TABLE workers ADD COLUMN national_id TEXT; -- national ID number
ALTER TABLE workers ADD COLUMN address TEXT; -- full address

-- ============================================================================
-- 5. PAYMENTS TABLE ENHANCEMENTS
-- ============================================================================

-- Add new fields to payments table
ALTER TABLE payments ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'check', 'transfer', 'card'));
ALTER TABLE payments ADD COLUMN receipt_number TEXT; -- receipt number
ALTER TABLE payments ADD COLUMN received_by TEXT; -- who received the payment

-- ============================================================================
-- 6. EXPENSES TABLE ENHANCEMENTS
-- ============================================================================

-- Add new fields to expenses table
ALTER TABLE expenses ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'check', 'transfer', 'card'));
ALTER TABLE expenses ADD COLUMN receipt_number TEXT; -- receipt number
ALTER TABLE expenses ADD COLUMN vendor TEXT; -- vendor/supplier name

-- ============================================================================
-- 7. NEW TABLE: QUALITY CONTROL
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_control (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  inspector_name TEXT NOT NULL,
  inspection_date INTEGER NOT NULL,
  quality_rating REAL NOT NULL DEFAULT 0, -- 0-5 rating
  passed BOOLEAN NOT NULL DEFAULT 1,
  defects_found TEXT, -- JSON array of defects
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================================================
-- 8. UPDATE INDICES
-- ============================================================================

-- Add new indices for better performance
CREATE INDEX IF NOT EXISTS idx_orders_urgency ON orders(urgency_level);
CREATE INDEX IF NOT EXISTS idx_orders_try_in_date ON orders(try_in_date);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier);
CREATE INDEX IF NOT EXISTS idx_materials_expiry ON materials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_workers_specialization ON workers(specialization);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);
CREATE INDEX IF NOT EXISTS idx_quality_control_order ON quality_control(order_id);
CREATE INDEX IF NOT EXISTS idx_dentists_clinic ON dentists(clinic_name);