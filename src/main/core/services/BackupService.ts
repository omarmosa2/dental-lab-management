import { executeQuery, executeNonQuery, reloadDatabase } from '../database/connection';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';

export interface BackupInfo {
  id: number;
  filename: string;
  filepath: string;
  size: number;
  created_at: number;
}

export class BackupService {
  private backupDir: string;
  private autoBackupInterval: NodeJS.Timeout | null = null;
  private readonly MAX_BACKUPS = 7; // Keep last 7 backups
  private readonly MIN_BACKUP_SIZE = 1024; // Minimum 1KB

  constructor(customBackupDir?: string) {
    // Use custom directory or default to Documents/DentalLabBackups
    this.backupDir = customBackupDir || path.join(app.getPath('documents'), 'DentalLabBackups');
    this.ensureBackupDirectory();
  }

  /**
   * Update backup directory
   */
  setBackupDirectory(newDir: string): void {
    this.backupDir = newDir;
    this.ensureBackupDirectory();
    log.info('Backup directory updated to:', this.backupDir);
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      log.info('Backup directory created:', this.backupDir);
    }
  }

  /**
   * Create a new backup with validation and rotation
   */
  async createBackup(): Promise<BackupInfo> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `dental-lab-backup-${timestamp}.db`;
      const filepath = path.join(this.backupDir, filename);

      // Get current database path (same as in connection.ts)
      const dbPath = path.join(app.getPath('userData'), 'dental-lab.db');

      // Simply copy the database file (sql.js saves to disk automatically)
      if (!fs.existsSync(dbPath)) {
        throw new Error('Database file not found');
      }

      await fs.promises.copyFile(dbPath, filepath);

      // Get file size
      const stats = await fs.promises.stat(filepath);
      const size = stats.size;

      // Validate backup
      const isValid = await this.validateBackup(filepath);
      if (!isValid) {
        // Delete invalid backup
        await fs.promises.unlink(filepath);
        throw new Error('Backup validation failed - backup file is corrupted or too small');
      }

      // Record backup in database
      executeNonQuery(
        'INSERT INTO backups (filename, filepath, size) VALUES (?, ?, ?)',
        [filename, filepath, size]
      );
      
      const result = executeQuery<{ id: number }>(
        'SELECT last_insert_rowid() as id'
      )[0];

      log.info('Backup created successfully:', filepath, `(${this.formatBytes(size)})`);

      // Rotate old backups
      await this.rotateBackups();

      return {
        id: result.id,
        filename,
        filepath,
        size,
        created_at: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      log.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Validate backup file
   */
  private async validateBackup(filepath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (!fs.existsSync(filepath)) {
        log.error('Backup validation failed: file does not exist');
        return false;
      }

      // Check file size
      const stats = await fs.promises.stat(filepath);
      if (stats.size < this.MIN_BACKUP_SIZE) {
        log.error('Backup validation failed: file too small', stats.size);
        return false;
      }

      // Check if it's a valid SQLite database
      const buffer = await fs.promises.readFile(filepath);
      const header = buffer.toString('utf8', 0, 16);
      if (!header.startsWith('SQLite format 3')) {
        log.error('Backup validation failed: not a valid SQLite database');
        return false;
      }

      log.info('Backup validation passed:', filepath);
      return true;
    } catch (error) {
      log.error('Backup validation error:', error);
      return false;
    }
  }

  /**
   * Rotate backups - keep only the last MAX_BACKUPS
   */
  private async rotateBackups(): Promise<void> {
    try {
      const backups = this.listBackups();
      
      if (backups.length > this.MAX_BACKUPS) {
        const backupsToDelete = backups.slice(this.MAX_BACKUPS);
        
        log.info(`Rotating backups: deleting ${backupsToDelete.length} old backup(s)`);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
        
        log.info(`Backup rotation complete. Kept ${this.MAX_BACKUPS} most recent backups`);
      }
    } catch (error) {
      log.error('Error rotating backups:', error);
      // Don't throw - rotation failure shouldn't prevent backup creation
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * List all backups with validation status
   */
  listBackups(): BackupInfo[] {
    try {
      const rows = executeQuery<BackupInfo>(`
        SELECT id, filename, filepath, size, created_at
        FROM backups
        ORDER BY created_at DESC
      `);

      // Filter out backups that no longer exist on disk and clean up database
      const validBackups = rows.filter(backup => {
        try {
          const exists = fs.existsSync(backup.filepath);
          if (!exists) {
            // Remove from database if file doesn't exist
            try {
              executeNonQuery('DELETE FROM backups WHERE id = ?', [backup.id]);
              log.warn('Removed missing backup from database:', backup.filename);
            } catch (err) {
              log.error('Error removing missing backup from database:', err);
            }
          }
          return exists;
        } catch {
          return false;
        }
      });

      log.info(`Listed ${validBackups.length} valid backup(s)`);
      return validBackups;
    } catch (error) {
      log.error('Error listing backups:', error);
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup: number | null;
    newestBackup: number | null;
  } {
    try {
      const backups = this.listBackups();
      
      return {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, b) => sum + b.size, 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created_at : null,
        newestBackup: backups.length > 0 ? backups[0].created_at : null,
      };
    } catch (error) {
      log.error('Error getting backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
      };
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: number): Promise<void> {
    try {
      // Get backup info
      const backups = executeQuery<{ filepath: string }>(
        'SELECT filepath FROM backups WHERE id = ?',
        [backupId]
      );
      
      const backup = backups[0];

      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!fs.existsSync(backup.filepath)) {
        throw new Error('Backup file does not exist');
      }

      // Get current database path (same as in connection.ts)
      const dbPath = path.join(app.getPath('userData'), 'dental-lab.db');

      // Create a backup of current database before restoring
      const emergencyBackup = path.join(this.backupDir, `emergency-backup-${Date.now()}.db`);
      if (fs.existsSync(dbPath)) {
        await fs.promises.copyFile(dbPath, emergencyBackup);
      }

      // Restore backup by copying file
      await fs.promises.copyFile(backup.filepath, dbPath);

      // CRITICAL: Reload the database from disk to reflect the restored data
      await reloadDatabase();

      log.info('Backup restored successfully from:', backup.filepath);
      log.info('Emergency backup created at:', emergencyBackup);
      log.info('Database reloaded with restored data');
    } catch (error) {
      log.error('Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: number): Promise<void> {
    try {
      // Get backup info
      const backups = executeQuery<{ filepath: string }>(
        'SELECT filepath FROM backups WHERE id = ?',
        [backupId]
      );
      
      const backup = backups[0];

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Delete file if exists
      if (fs.existsSync(backup.filepath)) {
        await fs.promises.unlink(backup.filepath);
      }

      // Remove from database
      executeNonQuery('DELETE FROM backups WHERE id = ?', [backupId]);

      log.info('Backup deleted successfully:', backup.filepath);
    } catch (error) {
      log.error('Error deleting backup:', error);
      throw error;
    }
  }

  /**
   * Clear all data (dangerous operation)
   */
  async clearAllData(): Promise<void> {
    try {
      // Delete all data from tables (preserve structure)
      executeNonQuery('DELETE FROM payments');
      executeNonQuery('DELETE FROM orders');
      executeNonQuery('DELETE FROM dentists');
      executeNonQuery('DELETE FROM materials');
      executeNonQuery('DELETE FROM expenses');
      executeNonQuery('DELETE FROM workers');
      // Don't delete settings and backups

      log.warn('All data cleared successfully');
    } catch (error) {
      log.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Get backup directory path
   */
  getBackupDirectory(): string {
    return this.backupDir;
  }

  /**
   * Start automatic backup with configurable interval
   */
  startAutoBackup(intervalHours = 24): void {
    // Clear any existing interval
    this.stopAutoBackup();

    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Run backup at specified interval
    this.autoBackupInterval = setInterval(async () => {
      try {
        log.info('Running automatic backup...');
        await this.createBackup();
        
        // Update last backup date in settings
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SettingsService } = require('./SettingsService');
        const settingsService = new SettingsService();
        settingsService.updateLastBackupDate();
        
        log.info('Automatic backup completed successfully');
      } catch (error) {
        log.error('Automatic backup failed:', error);
      }
    }, intervalMs);

    // Also run an initial backup after 1 minute if last backup is old
    setTimeout(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SettingsService } = require('./SettingsService');
        const settingsService = new SettingsService();
        const settings = settingsService.getSettings();
        
        const now = Math.floor(Date.now() / 1000);
        const lastBackup = settings.last_backup_date || 0;
        const hoursSinceLastBackup = (now - lastBackup) / 3600;
        
        if (hoursSinceLastBackup >= intervalHours) {
          log.info('Running initial automatic backup...');
          await this.createBackup();
          settingsService.updateLastBackupDate();
          log.info('Initial automatic backup completed');
        }
      } catch (error) {
        log.error('Initial automatic backup failed:', error);
      }
    }, 60 * 1000); // 1 minute

    log.info(`Automatic backup started (runs every ${intervalHours} hours)`);
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      log.info('Automatic backup stopped');
    }
  }

  /**
   * Check if auto backup should run based on settings
   */
  async checkAndRunAutoBackup(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SettingsService } = require('./SettingsService');
      const settingsService = new SettingsService();
      const settings = settingsService.getSettings();

      // Update backup directory if changed
      if (settings.backup_directory && settings.backup_directory !== this.backupDir) {
        this.setBackupDirectory(settings.backup_directory);
      }

      if (settings.auto_backup) {
        const intervalHours = settings.backup_interval_hours || 24;
        this.startAutoBackup(intervalHours);
      } else {
        this.stopAutoBackup();
      }
    } catch (error) {
      log.error('Error checking auto backup settings:', error);
    }
  }
}