-- Initial Database Schema for Dental Lab Management System
-- Created: 2025-01-09
-- Version: 0001

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations_applied (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Dentists table
CREATE TABLE IF NOT EXISTS dentists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
  residence TEXT NOT NULL,
  phone TEXT NOT NULL,
  case_types TEXT NOT NULL, -- JSON array
  color_options TEXT NOT NULL, -- JSON array
  cost REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Workers table (created before orders due to foreign key)
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  salary REAL NOT NULL DEFAULT 0,
  hire_date INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  dentist_id INTEGER NOT NULL,
  case_type TEXT NOT NULL,
  tooth_numbers TEXT NOT NULL, -- JSON array
  shade TEXT NOT NULL,
  main_material TEXT NOT NULL,
  finish_type TEXT NOT NULL,
  notes TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  date_received INTEGER NOT NULL,
  date_due INTEGER NOT NULL,
  date_delivered INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'delivered', 'cancelled')),
  price REAL NOT NULL DEFAULT 0,
  assigned_worker_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_worker_id) REFERENCES workers(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  date INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  min_quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  date INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_dentist_id ON orders(dentist_id);
CREATE INDEX IF NOT EXISTS idx_orders_date_received ON orders(date_received);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);