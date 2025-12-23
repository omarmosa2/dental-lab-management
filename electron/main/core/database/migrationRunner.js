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
exports.runMigrations = runMigrations;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const electron_log_1 = __importDefault(require("electron-log"));
const connection_1 = require("./connection");
/**
 * Calculate SHA256 checksum of a string
 */
function calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}
/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles() {
    // Try multiple possible paths
    const possiblePaths = [
        path.join(__dirname, 'migrations'),
        path.join(__dirname, '..', 'database', 'migrations'),
        path.join(__dirname, '..', '..', 'database', 'migrations'),
        path.join(process.cwd(), 'src', 'main', 'core', 'database', 'migrations'),
    ];
    let migrationsDir = '';
    for (const dir of possiblePaths) {
        if (fs.existsSync(dir)) {
            migrationsDir = dir;
            break;
        }
    }
    if (!migrationsDir) {
        electron_log_1.default.warn('Migrations directory not found');
        return [];
    }
    electron_log_1.default.info(`Using migrations directory: ${migrationsDir}`);
    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    return files.map(filename => {
        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, 'utf-8');
        const checksum = calculateChecksum(sql);
        return { filename, checksum, sql };
    });
}
/**
 * Get applied migrations from database
 */
function getAppliedMigrations() {
    try {
        const results = (0, connection_1.executeQuery)('SELECT filename FROM migrations_applied');
        return new Set(results.map(r => r.filename));
    }
    catch (error) {
        // Table doesn't exist yet, return empty set
        return new Set();
    }
}
/**
 * Remove SQL comments from a string
 */
function removeComments(sql) {
    // Remove single-line comments (-- comment)
    let cleaned = sql.replace(/--[^\n]*/g, '');
    // Remove multi-line comments (/* comment */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    return cleaned;
}
/**
 * Split SQL into individual statements
 */
function splitSqlStatements(sql) {
    // First remove all comments
    const cleanedSql = removeComments(sql);
    // Split by semicolon
    const statements = cleanedSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    return statements;
}
/**
 * Apply a single migration
 */
function applyMigration(migration) {
    const db = (0, connection_1.getDatabase)();
    try {
        electron_log_1.default.info(`Applying migration: ${migration.filename}`);
        // Split SQL into individual statements
        const statements = splitSqlStatements(migration.sql);
        electron_log_1.default.info(`Found ${statements.length} statements to execute`);
        // Start transaction
        db.run('BEGIN IMMEDIATE TRANSACTION');
        try {
            // Execute each statement
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                try {
                    db.run(statement);
                    electron_log_1.default.info(`[${i + 1}/${statements.length}] Statement executed: ${statement.substring(0, 80)}...`);
                }
                catch (stmtError) {
                    // Check if this is an acceptable error (idempotent operations)
                    const errorMsg = stmtError.message || '';
                    if (errorMsg.includes('duplicate column name') ||
                        errorMsg.includes('already exists')) {
                        electron_log_1.default.warn(`[${i + 1}/${statements.length}] Statement skipped (already exists): ${statement.substring(0, 100)}...`);
                    }
                    else {
                        electron_log_1.default.error(`[${i + 1}/${statements.length}] Statement failed: ${statement.substring(0, 100)}...`, stmtError);
                        throw stmtError;
                    }
                }
            }
            // Record migration as applied (within the same transaction)
            db.run('INSERT INTO migrations_applied (filename, checksum) VALUES (?, ?)', [migration.filename, migration.checksum]);
            // Commit transaction
            db.run('COMMIT');
            // Save database to disk
            (0, connection_1.saveDatabase)();
            electron_log_1.default.info(`Migration applied successfully: ${migration.filename}`);
        }
        catch (error) {
            // Rollback on any error
            db.run('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        electron_log_1.default.error(`Failed to apply migration ${migration.filename}:`, error);
        throw error;
    }
}
/**
 * Run all pending migrations
 */
async function runMigrations() {
    try {
        electron_log_1.default.info('Starting migration process...');
        const migrations = getMigrationFiles();
        const appliedMigrations = getAppliedMigrations();
        const pendingMigrations = migrations.filter(m => !appliedMigrations.has(m.filename));
        if (pendingMigrations.length === 0) {
            electron_log_1.default.info('No pending migrations');
            return;
        }
        electron_log_1.default.info(`Found ${pendingMigrations.length} pending migration(s)`);
        for (const migration of pendingMigrations) {
            applyMigration(migration);
        }
        // Save database after all migrations
        (0, connection_1.saveDatabase)();
        electron_log_1.default.info('All migrations completed successfully');
    }
    catch (error) {
        electron_log_1.default.error('Migration process failed:', error);
        throw error;
    }
}
