-- Migration 0004: WhatsApp Integration Tables
-- Created: 2025-01-11
-- Purpose: Add tables for WhatsApp integration using Baileys

-- Table: whatsapp_settings
-- Stores WhatsApp connection settings and preferences
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_enabled INTEGER DEFAULT 0, -- 0 = disabled, 1 = enabled
  is_connected INTEGER DEFAULT 0, -- 0 = disconnected, 1 = connected
  phone_number TEXT, -- Connected WhatsApp number
  send_on_order_complete INTEGER DEFAULT 1, -- Send notification when order is completed
  send_on_order_ready INTEGER DEFAULT 1, -- Send notification when order is ready
  send_on_order_delivered INTEGER DEFAULT 1, -- Send notification when order is delivered
  message_template_complete TEXT DEFAULT 'مرحباً د. {dentist_name}، تم إكمال الطلب رقم {order_number} بنجاح. التفاصيل: {case_type} - {tooth_numbers}. شكراً لثقتكم.',
  message_template_ready TEXT DEFAULT 'مرحباً د. {dentist_name}، الطلب رقم {order_number} جاهز للاستلام. يمكنكم المرور لاستلامه في أي وقت. شكراً.',
  message_template_delivered TEXT DEFAULT 'مرحباً د. {dentist_name}، تم تسليم الطلب رقم {order_number} بنجاح. نتمنى لكم التوفيق. شكراً لثقتكم.',
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Insert default settings
INSERT INTO whatsapp_settings (id, is_enabled) VALUES (1, 0);

-- Table: whatsapp_auth
-- Stores WhatsApp authentication session data
CREATE TABLE IF NOT EXISTS whatsapp_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_data TEXT, -- JSON string of Baileys auth state
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Table: whatsapp_message_log
-- Logs all sent WhatsApp messages for tracking and debugging
CREATE TABLE IF NOT EXISTS whatsapp_message_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  dentist_id INTEGER,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'order_complete', 'order_ready', 'order_delivered'
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE SET NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_order_id ON whatsapp_message_log(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_dentist_id ON whatsapp_message_log(dentist_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_status ON whatsapp_message_log(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_created_at ON whatsapp_message_log(created_at);