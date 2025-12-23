"use strict";
// WhatsAppRepository.ts
// Repository for WhatsApp settings, auth, and message logs
// Created: 2025-01-11
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppRepository = void 0;
const connection_1 = require("../database/connection");
class WhatsAppRepository {
    // ==================== Settings ====================
    async getSettings() {
        const results = (0, connection_1.executeQuery)('SELECT * FROM whatsapp_settings WHERE id = 1');
        return results.length > 0 ? results[0] : null;
    }
    async updateSettings(updates) {
        const fields = [];
        const values = [];
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
        (0, connection_1.executeNonQuery)(sql, values);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
        return this.getSettings();
    }
    async setConnectionStatus(isConnected, phoneNumber = null) {
        // Update both is_enabled and is_connected when connection status changes
        // This ensures that automatic notifications work when WhatsApp is connected
        (0, connection_1.executeNonQuery)('UPDATE whatsapp_settings SET is_enabled = ?, is_connected = ?, phone_number = ?, updated_at = ? WHERE id = 1', [isConnected ? 1 : 0, isConnected ? 1 : 0, phoneNumber, Math.floor(Date.now() / 1000)]);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
    }
    // ==================== Auth ====================
    async getAuth() {
        const results = (0, connection_1.executeQuery)('SELECT * FROM whatsapp_auth ORDER BY id DESC LIMIT 1');
        return results.length > 0 ? results[0] : null;
    }
    async saveAuth(sessionData) {
        // Delete old auth records
        (0, connection_1.executeNonQuery)('DELETE FROM whatsapp_auth');
        // Insert new auth
        (0, connection_1.executeNonQuery)('INSERT INTO whatsapp_auth (session_data, created_at, updated_at) VALUES (?, ?, ?)', [sessionData, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)]);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
    }
    async clearAuth() {
        (0, connection_1.executeNonQuery)('DELETE FROM whatsapp_auth');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
    }
    // ==================== Message Logs ====================
    async logMessage(log) {
        const results = (0, connection_1.executeQuery)(`INSERT INTO whatsapp_message_log 
       (order_id, dentist_id, phone_number, message_type, message_content, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`, [
            log.order_id || null,
            log.dentist_id || null,
            log.phone_number,
            log.message_type,
            log.message_content,
            log.status,
            log.error_message || null,
            log.sent_at || null
        ]);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
        return results[0];
    }
    async updateMessageStatus(id, status, errorMessage) {
        (0, connection_1.executeNonQuery)('UPDATE whatsapp_message_log SET status = ?, error_message = ?, sent_at = ? WHERE id = ?', [status, errorMessage || null, Math.floor(Date.now() / 1000), id]);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
    }
    async getMessageLogs(limit = 50, offset = 0) {
        return (0, connection_1.executeQuery)('SELECT * FROM whatsapp_message_log ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    }
    async getMessageLogsByOrder(orderId) {
        return (0, connection_1.executeQuery)('SELECT * FROM whatsapp_message_log WHERE order_id = ? ORDER BY created_at DESC', [orderId]);
    }
    async getMessageLogsByDentist(dentistId) {
        return (0, connection_1.executeQuery)('SELECT * FROM whatsapp_message_log WHERE dentist_id = ? ORDER BY created_at DESC', [dentistId]);
    }
    async getFailedMessages() {
        return (0, connection_1.executeQuery)("SELECT * FROM whatsapp_message_log WHERE status = 'failed' ORDER BY created_at DESC");
    }
}
exports.WhatsAppRepository = WhatsAppRepository;
