import { executeQuery, executeNonQuery } from '../database/connection';
import type { SqlValue } from 'sql.js';
import type { Worker, CreateWorkerDto, UpdateWorkerDto } from '../../../shared/types/api.types';
import { NotFoundError } from '../utils/errors';

export class WorkerRepository {
  /**
   * Get all workers (excluding soft-deleted) with optional pagination
   */
  findAll(page?: number, limit?: number): Worker[] {
    let sql = 'SELECT * FROM workers WHERE deleted_at IS NULL ORDER BY name ASC';
    const params: SqlValue[] = [];

    if (page !== undefined && limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);
    }

    return executeQuery<Worker>(sql, params);
  }

  /**
   * Get total count of workers (excluding soft-deleted)
   */
  count(): number {
    const results = executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM workers WHERE deleted_at IS NULL'
    );
    return results[0].count;
  }

  /**
   * Get active workers only (excluding soft-deleted)
   */
  findActive(): Worker[] {
    return executeQuery<Worker>(
      "SELECT * FROM workers WHERE status = 'active' AND deleted_at IS NULL ORDER BY name ASC"
    );
  }

  /**
   * Get worker by ID (excluding soft-deleted)
   */
  findById(id: number): Worker | null {
    const results = executeQuery<Worker>(
      'SELECT * FROM workers WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return results[0] || null;
  }

  /**
   * Create a new worker
   */
  create(dto: CreateWorkerDto): Worker {
    const now = Math.floor(Date.now() / 1000);

    const results = executeQuery<Worker>(
      `INSERT INTO workers (name, phone, salary, hire_date, status, specialization, performance_rating, national_id, address, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        dto.name,
        dto.phone,
        dto.salary,
        dto.hire_date,
        'active',
        dto.specialization || null,
        dto.performance_rating || 0,
        dto.national_id || null,
        dto.address || null,
        dto.notes || null,
        now,
        now,
      ] as SqlValue[]
    );

    if (!results || results.length === 0) {
      throw new Error('Failed to create worker');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    return results[0];
  }

  /**
   * Update a worker
   */
  update(dto: UpdateWorkerDto): Worker {
    const existing = this.findById(dto.id);
    if (!existing) {
      throw new NotFoundError('Worker', dto.id);
    }

    const now = Math.floor(Date.now() / 1000);
    const updates: string[] = [];
    const params: SqlValue[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      params.push(dto.name);
    }
    if (dto.phone !== undefined) {
      updates.push('phone = ?');
      params.push(dto.phone);
    }
    if (dto.salary !== undefined) {
      updates.push('salary = ?');
      params.push(dto.salary);
    }
    if (dto.hire_date !== undefined) {
      updates.push('hire_date = ?');
      params.push(dto.hire_date);
    }
    if (dto.status !== undefined) {
      updates.push('status = ?');
      params.push(dto.status);
    }
    if (dto.specialization !== undefined) {
      updates.push('specialization = ?');
      params.push(dto.specialization);
    }
    if (dto.performance_rating !== undefined) {
      updates.push('performance_rating = ?');
      params.push(dto.performance_rating);
    }
    if (dto.national_id !== undefined) {
      updates.push('national_id = ?');
      params.push(dto.national_id);
    }
    if (dto.address !== undefined) {
      updates.push('address = ?');
      params.push(dto.address);
    }
    if (dto.notes !== undefined) {
      updates.push('notes = ?');
      params.push(dto.notes);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(dto.id);

    executeNonQuery(
      `UPDATE workers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    const updated = this.findById(dto.id);
    if (!updated) {
      throw new Error('Failed to update worker');
    }

    return updated;
  }

  /**
   * Soft delete a worker
   */
  delete(id: number): void {
    const existing = this.findById(id);
    if (!existing) {
      throw new NotFoundError('Worker', id);
    }

    const now = Math.floor(Date.now() / 1000);
    executeNonQuery(
      'UPDATE workers SET deleted_at = ? WHERE id = ?',
      [now, id]
    );
  }

  /**
   * Restore a soft-deleted worker
   */
  restore(id: number): Worker {
    const results = executeQuery<Worker>(
      'SELECT * FROM workers WHERE id = ?',
      [id]
    );
    
    if (!results[0]) {
      throw new NotFoundError('Worker', id);
    }

    executeNonQuery(
      'UPDATE workers SET deleted_at = NULL WHERE id = ?',
      [id]
    );

    const restored = this.findById(id);
    if (!restored) {
      throw new Error('Failed to restore worker');
    }

    return restored;
  }

  /**
   * Permanently delete a worker (hard delete)
   */
  permanentDelete(id: number): void {
    executeNonQuery('DELETE FROM workers WHERE id = ?', [id]);
  }

  /**
   * Deactivate a worker
   */
  deactivate(id: number): Worker {
    return this.update({ id, status: 'inactive' });
  }

  /**
   * Activate a worker
   */
  activate(id: number): Worker {
    return this.update({ id, status: 'active' });
  }
}