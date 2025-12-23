import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import log from 'electron-log';
import { getDatabase, executeQuery, executeNonQuery, saveDatabase } from './connection';

interface Migration {
  filename: string;
  checksum: string;
  sql: string;
}

/**
 * Calculate SHA256 checksum of a string
 */
function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(): Migration[] {
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
    log.warn('Migrations directory not found');
    return [];
  }

  log.info(`Using migrations directory: ${migrationsDir}`);

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
function getAppliedMigrations(): Set<string> {
  try {
    const results = executeQuery<{ filename: string }>(
      'SELECT filename FROM migrations_applied'
    );
    return new Set(results.map(r => r.filename));
  } catch (error) {
    // Table doesn't exist yet, return empty set
    return new Set();
  }
}

/**
 * Remove SQL comments from a string
 */
function removeComments(sql: string): string {
  // Remove single-line comments (-- comment)
  let cleaned = sql.replace(/--[^\n]*/g, '');
  
  // Remove multi-line comments (/* comment */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  return cleaned;
}

/**
 * Split SQL into individual statements
 */
function splitSqlStatements(sql: string): string[] {
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
function applyMigration(migration: Migration): void {
  const db = getDatabase();
  
  try {
    log.info(`Applying migration: ${migration.filename}`);
    
    // Split SQL into individual statements
    const statements = splitSqlStatements(migration.sql);
    
    log.info(`Found ${statements.length} statements to execute`);
    
    // Start transaction
    db.run('BEGIN IMMEDIATE TRANSACTION');
    
    try {
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          db.run(statement);
          log.info(`[${i + 1}/${statements.length}] Statement executed: ${statement.substring(0, 80)}...`);
        } catch (stmtError: any) {
          // Check if this is an acceptable error (idempotent operations)
          const errorMsg = stmtError.message || '';
          
          if (errorMsg.includes('duplicate column name') || 
              errorMsg.includes('already exists')) {
            log.warn(`[${i + 1}/${statements.length}] Statement skipped (already exists): ${statement.substring(0, 100)}...`);
          } else {
            log.error(`[${i + 1}/${statements.length}] Statement failed: ${statement.substring(0, 100)}...`, stmtError);
            throw stmtError;
          }
        }
      }
      
      // Record migration as applied (within the same transaction)
      db.run(
        'INSERT INTO migrations_applied (filename, checksum) VALUES (?, ?)',
        [migration.filename, migration.checksum]
      );
      
      // Commit transaction
      db.run('COMMIT');
      
      // Save database to disk
      saveDatabase();
      
      log.info(`Migration applied successfully: ${migration.filename}`);
    } catch (error) {
      // Rollback on any error
      db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    log.error(`Failed to apply migration ${migration.filename}:`, error);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    log.info('Starting migration process...');
    
    const migrations = getMigrationFiles();
    const appliedMigrations = getAppliedMigrations();
    
    const pendingMigrations = migrations.filter(
      m => !appliedMigrations.has(m.filename)
    );
    
    if (pendingMigrations.length === 0) {
      log.info('No pending migrations');
      return;
    }
    
    log.info(`Found ${pendingMigrations.length} pending migration(s)`);
    
    for (const migration of pendingMigrations) {
      applyMigration(migration);
    }
    
    // Save database after all migrations
    saveDatabase();
    log.info('All migrations completed successfully');
  } catch (error) {
    log.error('Migration process failed:', error);
    throw error;
  }
}