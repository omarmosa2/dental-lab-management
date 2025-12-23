"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const connection_1 = require("../database/connection");
const electron_log_1 = __importDefault(require("electron-log"));
class AuditService {
    /**
     * Log an action to the audit trail
     */
    log(dto) {
        try {
            const now = Math.floor(Date.now() / 1000);
            // Calculate changed fields for UPDATE actions
            let changedFields = [];
            if (dto.action === 'UPDATE' && dto.old_values && dto.new_values) {
                changedFields = Object.keys(dto.new_values).filter(key => JSON.stringify(dto.old_values?.[key]) !== JSON.stringify(dto.new_values?.[key]));
            }
            (0, connection_1.executeNonQuery)(`INSERT INTO audit_log (
          table_name, record_id, action, old_values, new_values, 
          changed_fields, user_id, user_name, timestamp, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                dto.table_name,
                dto.record_id,
                dto.action,
                dto.old_values ? JSON.stringify(dto.old_values) : null,
                dto.new_values ? JSON.stringify(dto.new_values) : null,
                changedFields.length > 0 ? JSON.stringify(changedFields) : null,
                dto.user_id || null,
                dto.user_name || null,
                now,
                dto.notes || null,
            ]);
            electron_log_1.default.info('Audit log created:', {
                table: dto.table_name,
                record: dto.record_id,
                action: dto.action,
            });
        }
        catch (error) {
            electron_log_1.default.error('Failed to create audit log:', error);
            // Don't throw - audit logging should not break the main operation
        }
    }
    /**
     * Get audit logs for a specific record
     */
    getRecordHistory(tableName, recordId) {
        return (0, connection_1.executeQuery)(`SELECT * FROM audit_log 
       WHERE table_name = ? AND record_id = ? 
       ORDER BY timestamp DESC`, [tableName, recordId]);
    }
    /**
     * Get audit logs for a table
     */
    getTableHistory(tableName, limit = 100) {
        return (0, connection_1.executeQuery)(`SELECT * FROM audit_log 
       WHERE table_name = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`, [tableName, limit]);
    }
    /**
     * Get recent audit logs
     */
    getRecentLogs(limit = 50) {
        return (0, connection_1.executeQuery)(`SELECT * FROM audit_log 
       ORDER BY timestamp DESC 
       LIMIT ?`, [limit]);
    }
    /**
     * Get audit logs by action type
     */
    getLogsByAction(action, limit = 100) {
        return (0, connection_1.executeQuery)(`SELECT * FROM audit_log 
       WHERE action = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`, [action, limit]);
    }
    /**
     * Get audit logs for a date range
     */
    getLogsByDateRange(dateFrom, dateTo) {
        return (0, connection_1.executeQuery)(`SELECT * FROM audit_log 
       WHERE timestamp >= ? AND timestamp <= ? 
       ORDER BY timestamp DESC`, [dateFrom, dateTo]);
    }
    /**
     * Clear old audit logs (older than specified days)
     */
    clearOldLogs(daysToKeep = 90) {
        const cutoffDate = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
        const countResult = (0, connection_1.executeQuery)('SELECT COUNT(*) as count FROM audit_log WHERE timestamp < ?', [cutoffDate]);
        const count = countResult[0].count;
        if (count > 0) {
            (0, connection_1.executeNonQuery)('DELETE FROM audit_log WHERE timestamp < ?', [cutoffDate]);
            electron_log_1.default.info(`Cleared ${count} old audit logs (older than ${daysToKeep} days)`);
        }
        return count;
    }
}
exports.AuditService = AuditService;
