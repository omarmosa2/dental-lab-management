import type { Database, SqlValue } from 'sql.js';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log';

let db: Database | null = null;
let SQL: any = null;

/**
 * Get the database file path based on OS
 */
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'dental-lab.db');
}

/**
 * Initialize the database connection
 */
export async function initDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  try {
    log.info('Initializing database...');
    
    // Dynamic import to avoid webpack issues
    if (!SQL) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const initSqlJs = require('sql.js');
      // Use locateFile to find wasm file. When packaged, the wasm may be in resources or in an unpacked folder.
      SQL = await initSqlJs({
        locateFile: (file: string) => {
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
                log.info(`Found WASM file at: ${p}`);
                return p;
              }
            } catch (e) {
              // ignore and continue
            }
          }

          // Fallback - try node_modules directly
          const fallback = require.resolve('sql.js/dist/' + file);
          log.warn(`Using fallback WASM path: ${fallback}`);
          return fallback;
        }
      });
    }
    
    const dbPath = getDatabasePath();
    
    // Check if database file exists
    let buffer: Uint8Array | undefined;
    if (fs.existsSync(dbPath)) {
      log.info(`Loading existing database from: ${dbPath}`);
      buffer = fs.readFileSync(dbPath);
    } else {
      log.info(`Creating new database at: ${dbPath}`);
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
    
    log.info('Database initialized successfully');
    return db;
  } catch (error) {
    log.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Save database to disk
 */
export function saveDatabase(): void {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const dbPath = getDatabasePath();
    log.info(`[DB SAVE] Starting save to: ${dbPath}`);
    
    const data = db.export();
    const buffer = Buffer.from(data);
    log.info(`[DB SAVE] Exported data size: ${buffer.length} bytes`);
    
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      log.info(`[DB SAVE] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to a temp file first, then rename (atomic operation)
    const tempPath = `${dbPath}.tmp`;
    log.info(`[DB SAVE] Writing to temp file: ${tempPath}`);
    fs.writeFileSync(tempPath, buffer, { flag: 'w' });
    
    // Verify temp file was written
    if (!fs.existsSync(tempPath)) {
      throw new Error('Failed to write temp database file');
    }
    
    const tempStats = fs.statSync(tempPath);
    log.info(`[DB SAVE] Temp file written. Size: ${tempStats.size} bytes`);
    
    // Rename temp file to actual database file (atomic on most systems)
    if (fs.existsSync(dbPath)) {
      // Backup current file
      const backupPath = `${dbPath}.backup`;
      log.info(`[DB SAVE] Creating backup: ${backupPath}`);
      fs.copyFileSync(dbPath, backupPath);
    }
    
    log.info(`[DB SAVE] Renaming temp file to: ${dbPath}`);
    fs.renameSync(tempPath, dbPath);
    
    // Verify the file was saved
    const stats = fs.statSync(dbPath);
    log.info(`[DB SAVE] ✅ Database saved successfully. Size: ${stats.size} bytes, Path: ${dbPath}`);
    
    // Extra verification: Check file is readable
    const verification = fs.readFileSync(dbPath);
    log.info(`[DB SAVE] ✅ Verification read successful. Size: ${verification.length} bytes`);
  } catch (error) {
    log.error('[DB SAVE] ❌ Failed to save database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    log.info('Database closed');
  }
}

/**
 * Reload database from disk (useful after restore)
 */
export async function reloadDatabase(): Promise<Database> {
  try {
    log.info('Reloading database from disk...');
    
    // Close current database without saving
    if (db) {
      db.close();
      db = null;
    }
    
    // Reinitialize from disk
    const newDb = await initDatabase();
    log.info('Database reloaded successfully');
    return newDb;
  } catch (error) {
    log.error('Failed to reload database:', error);
    throw error;
  }
}

/**
 * Execute a query and return results
 */
export function executeQuery<T = unknown>(sql: string, params: SqlValue[] = []): T[] {
  const database = getDatabase();
  
  try {
    const stmt = database.prepare(sql);
    stmt.bind(params);
    
    const results: T[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as T);
    }
    stmt.free();
    
    return results;
  } catch (error) {
    log.error('Query execution failed:', { sql, params, error });
    throw error;
  }
}

/**
 * Execute a query without returning results (INSERT, UPDATE, DELETE)
 */
export function executeNonQuery(sql: string, params: SqlValue[] = []): void {
  const database = getDatabase();
  log.info('[DB EXEC] Executing non-query:', { sql: sql.substring(0, 100), params });
  database.run(sql, params);
  log.info('[DB EXEC] Non-query executed, now saving...');
  saveDatabase();
  log.info('[DB EXEC] Save completed');
}

/**
 * Execute multiple queries in a transaction
 * Returns the results of the last query if it's a RETURNING query
 */
export function executeTransaction<T = unknown>(
  queries: Array<{ sql: string; params?: SqlValue[] }>
): T[] {
  const database = getDatabase();
  let results: T[] = [];
  
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
        
        const queryResults: T[] = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          queryResults.push(row as T);
        }
        stmt.free();
        
        // Store results if it's the last query
        if (isLastQuery) {
          results = queryResults;
        }
      } else {
        database.run(query.sql, query.params || []);
      }
    }
    
    database.run('COMMIT');
    saveDatabase();
    
    return results;
  } catch (error) {
    database.run('ROLLBACK');
    log.error('Transaction failed:', error);
    throw error;
  }
}