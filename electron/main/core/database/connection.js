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
exports.getDatabasePath = getDatabasePath;
exports.initDatabase = initDatabase;
exports.saveDatabase = saveDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
exports.reloadDatabase = reloadDatabase;
exports.executeQuery = executeQuery;
exports.executeNonQuery = executeNonQuery;
exports.executeTransaction = executeTransaction;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
let db = null;
let SQL = null;
/**
 * Get the database file path based on OS
 */
function getDatabasePath() {
    const userDataPath = electron_1.app.getPath('userData');
    return path.join(userDataPath, 'dental-lab.db');
}
/**
 * Initialize the database connection
 */
async function initDatabase() {
    if (db) {
        return db;
    }
    try {
        electron_log_1.default.info('Initializing database...');
        // Dynamic import to avoid webpack issues
        if (!SQL) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const initSqlJs = require('sql.js');
            // Use locateFile to find wasm file. When packaged, the wasm may be in resources or in an unpacked folder.
            SQL = await initSqlJs({
                locateFile: (file) => {
                    // Candidate paths (dev / packaged / unpacked)
                    const candidates = [
                        // Development mode - node_modules
                        path.join(__dirname, '../../../node_modules/sql.js/dist', file),
                        path.join(process.cwd(), 'node_modules/sql.js/dist', file),
                        // Compiled dev mode
                        path.join(__dirname, file),
                        // Production - packaged
                        path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'main', 'core', 'database', file),
                        path.join(process.resourcesPath, 'electron', 'main', 'core', 'database', file),
                        path.join(process.resourcesPath, file),
                    ];
                    for (const p of candidates) {
                        try {
                            if (fs.existsSync(p)) {
                                electron_log_1.default.info(`Found WASM file at: ${p}`);
                                return p;
                            }
                        }
                        catch (e) {
                            // ignore and continue
                        }
                    }
                    // Fallback - try node_modules directly
                    const fallback = require.resolve('sql.js/dist/' + file);
                    electron_log_1.default.warn(`Using fallback WASM path: ${fallback}`);
                    return fallback;
                }
            });
        }
        const dbPath = getDatabasePath();
        // Check if database file exists
        let buffer;
        if (fs.existsSync(dbPath)) {
            electron_log_1.default.info(`Loading existing database from: ${dbPath}`);
            buffer = fs.readFileSync(dbPath);
        }
        else {
            electron_log_1.default.info(`Creating new database at: ${dbPath}`);
        }
        // Create or open database
        db = new SQL.Database(buffer);
        // Create migrations_applied table if it doesn't exist
        db.run(`
      CREATE TABLE IF NOT EXISTS migrations_applied (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        checksum TEXT,
        applied_at INTEGER DEFAULT (strftime('%s','now'))
      )
    `);
        electron_log_1.default.info('Database initialized successfully');
        return db;
    }
    catch (error) {
        electron_log_1.default.error('Failed to initialize database:', error);
        throw error;
    }
}
/**
 * Save database to disk
 */
function saveDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    try {
        const dbPath = getDatabasePath();
        electron_log_1.default.info(`[DB SAVE] Starting save to: ${dbPath}`);
        const data = db.export();
        const buffer = Buffer.from(data);
        electron_log_1.default.info(`[DB SAVE] Exported data size: ${buffer.length} bytes`);
        // Ensure directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            electron_log_1.default.info(`[DB SAVE] Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
        // ✅ WINDOWS FIX: Use direct write instead of temp+rename
        // This avoids EPERM errors completely
        // Backup existing file first
        if (fs.existsSync(dbPath)) {
            const backupPath = `${dbPath}.backup`;
            electron_log_1.default.info(`[DB SAVE] Creating backup: ${backupPath}`);
            try {
                // Remove old backup if exists
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
                // Create new backup
                fs.copyFileSync(dbPath, backupPath);
                electron_log_1.default.info(`[DB SAVE] ✅ Backup created successfully`);
            }
            catch (backupError) {
                electron_log_1.default.warn(`[DB SAVE] ⚠️ Backup failed (continuing anyway):`, backupError.message);
            }
        }
        // Direct write to database file (overwrites existing)
        electron_log_1.default.info(`[DB SAVE] Writing directly to: ${dbPath}`);
        try {
            fs.writeFileSync(dbPath, buffer, { flag: 'w' });
            electron_log_1.default.info(`[DB SAVE] ✅ File written successfully`);
        }
        catch (writeError) {
            electron_log_1.default.error(`[DB SAVE] ❌ Write failed:`, writeError.message);
            // Try to restore from backup
            const backupPath = `${dbPath}.backup`;
            if (fs.existsSync(backupPath)) {
                electron_log_1.default.info(`[DB SAVE] Attempting to restore from backup...`);
                try {
                    fs.copyFileSync(backupPath, dbPath);
                    electron_log_1.default.info(`[DB SAVE] ✅ Restored from backup`);
                }
                catch (restoreError) {
                    electron_log_1.default.error(`[DB SAVE] ❌ Restore from backup also failed`);
                }
            }
            throw new Error(`Failed to save database: ${writeError.message}`);
        }
        // Force sync to disk
        electron_log_1.default.info(`[DB SAVE] Forcing sync to disk...`);
        try {
            const fd = fs.openSync(dbPath, 'r');
            fs.fsyncSync(fd);
            fs.closeSync(fd);
            electron_log_1.default.info(`[DB SAVE] ✅ Sync completed`);
        }
        catch (syncError) {
            electron_log_1.default.warn(`[DB SAVE] ⚠️ Sync failed (data may not be on disk yet):`, syncError.message);
        }
        // Verify the file was saved
        const stats = fs.statSync(dbPath);
        electron_log_1.default.info(`[DB SAVE] ✅ Database saved successfully. Size: ${stats.size} bytes, Path: ${dbPath}`);
        // Extra verification: Check file is readable
        try {
            const verification = fs.readFileSync(dbPath);
            electron_log_1.default.info(`[DB SAVE] ✅ Verification read successful. Size: ${verification.length} bytes`);
        }
        catch (verifyError) {
            electron_log_1.default.error(`[DB SAVE] ❌ Verification read failed:`, verifyError.message);
            throw new Error('Database saved but cannot be read back');
        }
    }
    catch (error) {
        electron_log_1.default.error('[DB SAVE] ❌ Failed to save database:', error);
        throw error;
    }
}
/**
 * Get the database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}
/**
 * Close the database connection
 */
function closeDatabase() {
    if (db) {
        saveDatabase();
        db.close();
        db = null;
        electron_log_1.default.info('Database closed');
    }
}
/**
 * Reload database from disk (useful after restore)
 */
async function reloadDatabase() {
    try {
        electron_log_1.default.info('Reloading database from disk...');
        // Close current database without saving
        if (db) {
            db.close();
            db = null;
        }
        // Reinitialize from disk
        const newDb = await initDatabase();
        electron_log_1.default.info('Database reloaded successfully');
        return newDb;
    }
    catch (error) {
        electron_log_1.default.error('Failed to reload database:', error);
        throw error;
    }
}
/**
 * Execute a query and return results
 */
function executeQuery(sql, params = []) {
    const database = getDatabase();
    try {
        const stmt = database.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(row);
        }
        stmt.free();
        return results;
    }
    catch (error) {
        electron_log_1.default.error('Query execution failed:', { sql, params, error });
        throw error;
    }
}
/**
 * Execute a query without returning results (INSERT, UPDATE, DELETE)
 */
function executeNonQuery(sql, params = []) {
    const database = getDatabase();
    electron_log_1.default.info('[DB EXEC] Executing non-query:', { sql: sql.substring(0, 100), params });
    database.run(sql, params);
    electron_log_1.default.info('[DB EXEC] Non-query executed (not saved yet)');
}
/**
 * Execute multiple queries in a transaction
 * Returns the results of the last query if it's a RETURNING query
 */
function executeTransaction(queries) {
    const database = getDatabase();
    let results = [];
    try {
        database.run('BEGIN IMMEDIATE TRANSACTION');
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            const isLastQuery = i === queries.length - 1;
            // If it's a SELECT or RETURNING query, get results
            if (query.sql.trim().toUpperCase().includes('RETURNING') ||
                query.sql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = database.prepare(query.sql);
                stmt.bind(query.params || []);
                const queryResults = [];
                while (stmt.step()) {
                    const row = stmt.getAsObject();
                    queryResults.push(row);
                }
                stmt.free();
                // Store results if it's the last query
                if (isLastQuery) {
                    results = queryResults;
                }
            }
            else {
                database.run(query.sql, query.params || []);
            }
        }
        database.run('COMMIT');
        saveDatabase();
        return results;
    }
    catch (error) {
        database.run('ROLLBACK');
        electron_log_1.default.error('Transaction failed:', error);
        throw error;
    }
}
