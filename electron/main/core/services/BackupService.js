"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const connection_1 = require("../database/connection");
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
class BackupService {
    constructor(customBackupDir) {
        this.autoBackupInterval = null;
        this.MAX_BACKUPS = 7; // Keep last 7 backups
        this.MIN_BACKUP_SIZE = 1024; // Minimum 1KB
        // Use custom directory or default to Documents/DentalLabBackups
        this.backupDir = customBackupDir || path.join(electron_1.app.getPath('documents'), 'DentalLabBackups');
        this.ensureBackupDirectory();
    }
    /**
     * Update backup directory
     */
    setBackupDirectory(newDir) {
        this.backupDir = newDir;
        this.ensureBackupDirectory();
        electron_log_1.default.info('Backup directory updated to:', this.backupDir);
    }
    /**
     * Ensure backup directory exists
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            electron_log_1.default.info('Backup directory created:', this.backupDir);
        }
    }
    /**
     * Create a new backup with validation and rotation
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `dental-lab-backup-${timestamp}.db`;
            const filepath = path.join(this.backupDir, filename);
            // Get current database path (same as in connection.ts)
            const dbPath = path.join(electron_1.app.getPath('userData'), 'dental-lab.db');
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
            (0, connection_1.executeNonQuery)('INSERT INTO backups (filename, filepath, size) VALUES (?, ?, ?)', [filename, filepath, size]);
            const result = (0, connection_1.executeQuery)('SELECT last_insert_rowid() as id')[0];
            electron_log_1.default.info('Backup created successfully:', filepath, `(${this.formatBytes(size)})`);
            // Rotate old backups
            await this.rotateBackups();
            return {
                id: result.id,
                filename,
                filepath,
                size,
                created_at: Math.floor(Date.now() / 1000),
            };
        }
        catch (error) {
            electron_log_1.default.error('Error creating backup:', error);
            throw error;
        }
    }
    /**
     * Validate backup file
     */
    async validateBackup(filepath) {
        try {
            // Check if file exists
            if (!fs.existsSync(filepath)) {
                electron_log_1.default.error('Backup validation failed: file does not exist');
                return false;
            }
            // Check file size
            const stats = await fs.promises.stat(filepath);
            if (stats.size < this.MIN_BACKUP_SIZE) {
                electron_log_1.default.error('Backup validation failed: file too small', stats.size);
                return false;
            }
            // Check if it's a valid SQLite database
            const buffer = await fs.promises.readFile(filepath);
            const header = buffer.toString('utf8', 0, 16);
            if (!header.startsWith('SQLite format 3')) {
                electron_log_1.default.error('Backup validation failed: not a valid SQLite database');
                return false;
            }
            electron_log_1.default.info('Backup validation passed:', filepath);
            return true;
        }
        catch (error) {
            electron_log_1.default.error('Backup validation error:', error);
            return false;
        }
    }
    /**
     * Rotate backups - keep only the last MAX_BACKUPS
     */
    async rotateBackups() {
        try {
            const backups = this.listBackups();
            if (backups.length > this.MAX_BACKUPS) {
                const backupsToDelete = backups.slice(this.MAX_BACKUPS);
                electron_log_1.default.info(`Rotating backups: deleting ${backupsToDelete.length} old backup(s)`);
                for (const backup of backupsToDelete) {
                    await this.deleteBackup(backup.id);
                }
                electron_log_1.default.info(`Backup rotation complete. Kept ${this.MAX_BACKUPS} most recent backups`);
            }
        }
        catch (error) {
            electron_log_1.default.error('Error rotating backups:', error);
            // Don't throw - rotation failure shouldn't prevent backup creation
        }
    }
    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    /**
     * List all backups with validation status
     */
    listBackups() {
        try {
            const rows = (0, connection_1.executeQuery)(`
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
                            (0, connection_1.executeNonQuery)('DELETE FROM backups WHERE id = ?', [backup.id]);
                            electron_log_1.default.warn('Removed missing backup from database:', backup.filename);
                        }
                        catch (err) {
                            electron_log_1.default.error('Error removing missing backup from database:', err);
                        }
                    }
                    return exists;
                }
                catch {
                    return false;
                }
            });
            electron_log_1.default.info(`Listed ${validBackups.length} valid backup(s)`);
            return validBackups;
        }
        catch (error) {
            electron_log_1.default.error('Error listing backups:', error);
            throw error;
        }
    }
    /**
     * Get backup statistics
     */
    getBackupStats() {
        try {
            const backups = this.listBackups();
            return {
                totalBackups: backups.length,
                totalSize: backups.reduce((sum, b) => sum + b.size, 0),
                oldestBackup: backups.length > 0 ? backups[backups.length - 1].created_at : null,
                newestBackup: backups.length > 0 ? backups[0].created_at : null,
            };
        }
        catch (error) {
            electron_log_1.default.error('Error getting backup stats:', error);
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
    async restoreBackup(backupId) {
        try {
            // Get backup info
            const backups = (0, connection_1.executeQuery)('SELECT filepath FROM backups WHERE id = ?', [backupId]);
            const backup = backups[0];
            if (!backup) {
                throw new Error('Backup not found');
            }
            if (!fs.existsSync(backup.filepath)) {
                throw new Error('Backup file does not exist');
            }
            // Get current database path (same as in connection.ts)
            const dbPath = path.join(electron_1.app.getPath('userData'), 'dental-lab.db');
            // Create a backup of current database before restoring
            const emergencyBackup = path.join(this.backupDir, `emergency-backup-${Date.now()}.db`);
            if (fs.existsSync(dbPath)) {
                await fs.promises.copyFile(dbPath, emergencyBackup);
            }
            // Restore backup by copying file
            await fs.promises.copyFile(backup.filepath, dbPath);
            // CRITICAL: Reload the database from disk to reflect the restored data
            await (0, connection_1.reloadDatabase)();
            electron_log_1.default.info('Backup restored successfully from:', backup.filepath);
            electron_log_1.default.info('Emergency backup created at:', emergencyBackup);
            electron_log_1.default.info('Database reloaded with restored data');
        }
        catch (error) {
            electron_log_1.default.error('Error restoring backup:', error);
            throw error;
        }
    }
    /**
     * Delete a backup
     */
    async deleteBackup(backupId) {
        try {
            // Get backup info
            const backups = (0, connection_1.executeQuery)('SELECT filepath FROM backups WHERE id = ?', [backupId]);
            const backup = backups[0];
            if (!backup) {
                throw new Error('Backup not found');
            }
            // Delete file if exists
            if (fs.existsSync(backup.filepath)) {
                await fs.promises.unlink(backup.filepath);
            }
            // Remove from database
            (0, connection_1.executeNonQuery)('DELETE FROM backups WHERE id = ?', [backupId]);
            electron_log_1.default.info('Backup deleted successfully:', backup.filepath);
        }
        catch (error) {
            electron_log_1.default.error('Error deleting backup:', error);
            throw error;
        }
    }
    /**
     * Clear all data (dangerous operation)
     */
    async clearAllData() {
        try {
            // Delete all data from tables (preserve structure)
            (0, connection_1.executeNonQuery)('DELETE FROM payments');
            (0, connection_1.executeNonQuery)('DELETE FROM orders');
            (0, connection_1.executeNonQuery)('DELETE FROM dentists');
            (0, connection_1.executeNonQuery)('DELETE FROM materials');
            (0, connection_1.executeNonQuery)('DELETE FROM expenses');
            (0, connection_1.executeNonQuery)('DELETE FROM workers');
            // Don't delete settings and backups
            electron_log_1.default.warn('All data cleared successfully');
        }
        catch (error) {
            electron_log_1.default.error('Error clearing data:', error);
            throw error;
        }
    }
    /**
     * Get backup directory path
     */
    getBackupDirectory() {
        return this.backupDir;
    }
    /**
     * Start automatic backup with configurable interval
     */
    startAutoBackup(intervalHours = 24) {
        // Clear any existing interval
        this.stopAutoBackup();
        const intervalMs = intervalHours * 60 * 60 * 1000;
        // Run backup at specified interval
        this.autoBackupInterval = setInterval(async () => {
            try {
                electron_log_1.default.info('Running automatic backup...');
                await this.createBackup();
                // Update last backup date in settings
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { SettingsService } = require('./SettingsService');
                const settingsService = new SettingsService();
                settingsService.updateLastBackupDate();
                electron_log_1.default.info('Automatic backup completed successfully');
            }
            catch (error) {
                electron_log_1.default.error('Automatic backup failed:', error);
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
                    electron_log_1.default.info('Running initial automatic backup...');
                    await this.createBackup();
                    settingsService.updateLastBackupDate();
                    electron_log_1.default.info('Initial automatic backup completed');
                }
            }
            catch (error) {
                electron_log_1.default.error('Initial automatic backup failed:', error);
            }
        }, 60 * 1000); // 1 minute
        electron_log_1.default.info(`Automatic backup started (runs every ${intervalHours} hours)`);
    }
    /**
     * Stop automatic backup
     */
    stopAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
            electron_log_1.default.info('Automatic backup stopped');
        }
    }
    /**
     * Check if auto backup should run based on settings
     */
    async checkAndRunAutoBackup() {
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
            }
            else {
                this.stopAutoBackup();
            }
        }
        catch (error) {
            electron_log_1.default.error('Error checking auto backup settings:', error);
        }
    }
}
exports.BackupService = BackupService;
