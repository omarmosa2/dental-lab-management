import { executeQuery, executeNonQuery } from '../database/connection';
import { ValidationError } from '../utils/errors';
import log from 'electron-log';

export interface AppSettings {
  id: number;
  app_name: string;
  theme: 'light' | 'dark';
  auto_backup: boolean;
  backup_interval_hours: number;
  backup_directory: string;
  notifications: boolean;
  last_backup_date?: number;
  created_at: number;
  updated_at: number;
}

export interface UpdateSettingsDto {
  app_name?: string;
  theme?: 'light' | 'dark';
  auto_backup?: boolean;
  backup_interval_hours?: number;
  backup_directory?: string;
  notifications?: boolean;
}

export class SettingsService {
  constructor() {
    // No need to store db instance
  }

  /**
   * Get current settings
   */
  getSettings(): AppSettings {
    try {
      // First ensure default settings exist
      this.ensureDefaultSettings();
      
      const rows = executeQuery<AppSettings>(`
        SELECT 
          id,
          app_name,
          theme,
          auto_backup,
          backup_interval_hours,
          backup_directory,
          notifications,
          last_backup_date,
          created_at,
          updated_at
        FROM settings
        WHERE id = 1
      `);

      const row = rows[0];

      if (!row) {
        // Return default values if still not found
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { app } = require('electron');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path');
        const defaultBackupDir = path.join(app.getPath('documents'), 'DentalLabBackups');
        
        return {
          id: 1,
          app_name: 'نظام إدارة مختبر الأسنان',
          theme: 'light',
          auto_backup: false,
          backup_interval_hours: 24,
          backup_directory: defaultBackupDir,
          notifications: true,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        };
      }

      return {
        id: row.id,
        app_name: row.app_name,
        theme: row.theme,
        auto_backup: Boolean(row.auto_backup),
        backup_interval_hours: row.backup_interval_hours || 24,
        backup_directory: row.backup_directory,
        notifications: Boolean(row.notifications),
        last_backup_date: row.last_backup_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error) {
      log.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Update settings
   */
  updateSettings(dto: UpdateSettingsDto): void {
    try {
      const updates: string[] = [];
      const params: Record<string, string | number> = {};

      if (dto.app_name !== undefined) {
        updates.push('app_name = $app_name');
        params.$app_name = dto.app_name;
      }

      if (dto.theme !== undefined) {
        if (!['light', 'dark'].includes(dto.theme)) {
          throw new ValidationError('Invalid theme value');
        }
        updates.push('theme = $theme');
        params.$theme = dto.theme;
      }

      if (dto.auto_backup !== undefined) {
        updates.push('auto_backup = $auto_backup');
        params.$auto_backup = dto.auto_backup ? 1 : 0;
      }

      if (dto.backup_interval_hours !== undefined) {
        updates.push('backup_interval_hours = $backup_interval_hours');
        params.$backup_interval_hours = dto.backup_interval_hours;
      }

      if (dto.backup_directory !== undefined) {
        updates.push('backup_directory = $backup_directory');
        params.$backup_directory = dto.backup_directory;
      }

      if (dto.notifications !== undefined) {
        updates.push('notifications = $notifications');
        params.$notifications = dto.notifications ? 1 : 0;
      }

      if (updates.length === 0) {
        return;
      }

      updates.push("updated_at = strftime('%s', 'now')");

      executeNonQuery(
        `UPDATE settings SET ${updates.join(', ')} WHERE id = 1`,
        params as any
      );

      log.info('Settings updated successfully');
    } catch (error) {
      log.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Update last backup date
   */
  updateLastBackupDate(): void {
    try {
      executeNonQuery(`
        UPDATE settings
        SET last_backup_date = strftime('%s', 'now'),
            updated_at = strftime('%s', 'now')
        WHERE id = 1
      `);
    } catch (error) {
      log.error('Error updating last backup date:', error);
      throw error;
    }
  }

  /**
   * Ensure default settings exist
   */
  private ensureDefaultSettings(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { app } = require('electron');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      const defaultBackupDir = path.join(app.getPath('documents'), 'DentalLabBackups');
      
      executeNonQuery(`
        INSERT OR IGNORE INTO settings (id, app_name, theme, auto_backup, backup_interval_hours, backup_directory, notifications)
        VALUES (1, 'نظام إدارة مختبر الأسنان', 'light', 0, 24, ?, 1)
      `, [defaultBackupDir]);
    } catch (error) {
      log.error('Error ensuring default settings:', error);
      // Don't throw, just log
    }
  }
}