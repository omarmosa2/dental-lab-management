-- Migration: Add soft delete support
-- Date: 2025-01-11
-- Description: Add deleted_at column to all main tables for soft delete functionality

-- Add deleted_at to dentists
ALTER TABLE dentists ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Add deleted_at to orders
ALTER TABLE orders ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Add deleted_at to workers
ALTER TABLE workers ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Add deleted_at to materials
ALTER TABLE materials ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Add deleted_at to expenses
ALTER TABLE expenses ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Add deleted_at to payments (for soft delete of payment records)
ALTER TABLE payments ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Create indices for soft delete queries
CREATE INDEX IF NOT EXISTS idx_dentists_deleted_at ON dentists(deleted_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_workers_deleted_at ON workers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_materials_deleted_at ON materials(deleted_at);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);