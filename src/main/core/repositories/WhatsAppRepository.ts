// WhatsAppRepository.ts
// Repository for WhatsApp settings, auth, and message logs
// Created: 2025-01-11

import type { 
  WhatsAppSettings, 
  WhatsAppAuth, 
  WhatsAppMessageLog,
  WhatsAppSettingsUpdateDto 
} from '../../../shared/types/whatsapp.types';
import { executeQuery, executeNonQuery } from '../database/connection';

export class WhatsAppRepository {
  // ==================== Settings ====================
  
  async getSettings(): Promise<WhatsAppSettings | null> {
    const results = executeQuery<WhatsAppSettings>('SELECT * FROM whatsapp_settings WHERE id = 1');
    return results.length > 0 ? results[0] : null;
  }

  async updateSettings(updates: WhatsAppSettingsUpdateDto): Promise<WhatsAppSettings | null> {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      values.push(value);
    });

    if (fields.length === 0) {
      return this.getSettings();
    }

    fields.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    values.push(1); // WHERE id = 1

    const sql = `UPDATE whatsapp_settings SET ${fields.join(', ')} WHERE id = ?`;
    executeNonQuery(sql, values);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    return this.getSettings();
  }

  async setConnectionStatus(isConnected: boolean, phoneNumber: string | null = null): Promise<void> {
    // Update both is_enabled and is_connected when connection status changes
    // This ensures that automatic notifications work when WhatsApp is connected
    executeNonQuery(
      'UPDATE whatsapp_settings SET is_enabled = ?, is_connected = ?, phone_number = ?, updated_at = ? WHERE id = 1',
      [isConnected ? 1 : 0, isConnected ? 1 : 0, phoneNumber, Math.floor(Date.now() / 1000)]
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();
  }

  // ==================== Auth ====================
  
  async getAuth(): Promise<WhatsAppAuth | null> {
    const results = executeQuery<WhatsAppAuth>('SELECT * FROM whatsapp_auth ORDER BY id DESC LIMIT 1');
    return results.length > 0 ? results[0] : null;
  }

  async saveAuth(sessionData: string): Promise<void> {
    // Delete old auth records
    executeNonQuery('DELETE FROM whatsapp_auth');

    // Insert new auth
    executeNonQuery(
      'INSERT INTO whatsapp_auth (session_data, created_at, updated_at) VALUES (?, ?, ?)',
      [sessionData, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)]
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();
  }

  async clearAuth(): Promise<void> {
    executeNonQuery('DELETE FROM whatsapp_auth');
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();
  }

  // ==================== Message Logs ====================
  
  async logMessage(log: Omit<WhatsAppMessageLog, 'id' | 'created_at'>): Promise<WhatsAppMessageLog> {
    const results = executeQuery<WhatsAppMessageLog>(
      `INSERT INTO whatsapp_message_log 
       (order_id, dentist_id, phone_number, message_type, message_content, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        log.order_id || null,
        log.dentist_id || null,
        log.phone_number,
        log.message_type,
        log.message_content,
        log.status,
        log.error_message || null,
        log.sent_at || null
      ]
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    return results[0];
  }

  async updateMessageStatus(
    id: number, 
    status: 'sent' | 'failed', 
    errorMessage?: string
  ): Promise<void> {
    executeNonQuery(
      'UPDATE whatsapp_message_log SET status = ?, error_message = ?, sent_at = ? WHERE id = ?',
      [status, errorMessage || null, Math.floor(Date.now() / 1000), id]
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();
  }

  async getMessageLogs(limit = 50, offset = 0): Promise<WhatsAppMessageLog[]> {
    return executeQuery<WhatsAppMessageLog>(
      'SELECT * FROM whatsapp_message_log ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  async getMessageLogsByOrder(orderId: number): Promise<WhatsAppMessageLog[]> {
    return executeQuery<WhatsAppMessageLog>(
      'SELECT * FROM whatsapp_message_log WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );
  }

  async getMessageLogsByDentist(dentistId: number): Promise<WhatsAppMessageLog[]> {
    return executeQuery<WhatsAppMessageLog>(
      'SELECT * FROM whatsapp_message_log WHERE dentist_id = ? ORDER BY created_at DESC',
      [dentistId]
    );
  }

  async getFailedMessages(): Promise<WhatsAppMessageLog[]> {
    return executeQuery<WhatsAppMessageLog>(
      "SELECT * FROM whatsapp_message_log WHERE status = 'failed' ORDER BY created_at DESC"
    );
  }
}