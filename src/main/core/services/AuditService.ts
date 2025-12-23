import { executeNonQuery, executeQuery } from '../database/connection';
import type { SqlValue } from 'sql.js';
import log from 'electron-log';

export interface AuditLogEntry {
  id: number;
  table_name: string;
  record_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  old_values: string | null;
  new_values: string | null;
  changed_fields: string | null;
  user_id: number | null;
  user_name: string | null;
  ip_address: string | null;
  timestamp: number;
  notes: string | null;
}

export interface CreateAuditLogDto {
  table_name: string;
  record_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  user_id?: number;
  user_name?: string;
  notes?: string;
}

export class AuditService {
  /**
   * Log an action to the audit trail
   */
  log(dto: CreateAuditLogDto): void {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Calculate changed fields for UPDATE actions
      let changedFields: string[] = [];
      if (dto.action === 'UPDATE' && dto.old_values && dto.new_values) {
        changedFields = Object.keys(dto.new_values).filter(
          key => JSON.stringify(dto.old_values?.[key]) !== JSON.stringify(dto.new_values?.[key])
        );
      }

      executeNonQuery(
        `INSERT INTO audit_log (
          table_name, record_id, action, old_values, new_values, 
          changed_fields, user_id, user_name, timestamp, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ] as SqlValue[]
      );

      log.info('Audit log created:', {
        table: dto.table_name,
        record: dto.record_id,
        action: dto.action,
      });
    } catch (error) {
      log.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  /**
   * Get audit logs for a specific record
   */
  getRecordHistory(tableName: string, recordId: number): AuditLogEntry[] {
    return executeQuery<AuditLogEntry>(
      `SELECT * FROM audit_log 
       WHERE table_name = ? AND record_id = ? 
       ORDER BY timestamp DESC`,
      [tableName, recordId]
    );
  }

  /**
   * Get audit logs for a table
   */
  getTableHistory(tableName: string, limit = 100): AuditLogEntry[] {
    return executeQuery<AuditLogEntry>(
      `SELECT * FROM audit_log 
       WHERE table_name = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [tableName, limit]
    );
  }

  /**
   * Get recent audit logs
   */
  getRecentLogs(limit = 50): AuditLogEntry[] {
    return executeQuery<AuditLogEntry>(
      `SELECT * FROM audit_log 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Get audit logs by action type
   */
  getLogsByAction(action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE', limit = 100): AuditLogEntry[] {
    return executeQuery<AuditLogEntry>(
      `SELECT * FROM audit_log 
       WHERE action = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [action, limit]
    );
  }

  /**
   * Get audit logs for a date range
   */
  getLogsByDateRange(dateFrom: number, dateTo: number): AuditLogEntry[] {
    return executeQuery<AuditLogEntry>(
      `SELECT * FROM audit_log 
       WHERE timestamp >= ? AND timestamp <= ? 
       ORDER BY timestamp DESC`,
      [dateFrom, dateTo]
    );
  }

  /**
   * Clear old audit logs (older than specified days)
   */
  clearOldLogs(daysToKeep = 90): number {
    const cutoffDate = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
    
    const countResult = executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM audit_log WHERE timestamp < ?',
      [cutoffDate]
    );
    
    const count = countResult[0].count;
    
    if (count > 0) {
      executeNonQuery(
        'DELETE FROM audit_log WHERE timestamp < ?',
        [cutoffDate]
      );
      
      log.info(`Cleared ${count} old audit logs (older than ${daysToKeep} days)`);
    }
    
    return count;
  }
}