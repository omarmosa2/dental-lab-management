import { executeQuery, executeNonQuery } from '../database/connection';
import type { SqlValue } from 'sql.js';
import type { Dentist, CreateDentistDto, UpdateDentistDto } from '../../../shared/types/api.types';
import { NotFoundError } from '../utils/errors';

export class DentistRepository {
  /**
   * Get all dentists (excluding soft-deleted) with optional pagination
   */
  findAll(page?: number, limit?: number): Dentist[] {
    let sql = 'SELECT * FROM dentists WHERE deleted_at IS NULL ORDER BY name ASC';
    const params: SqlValue[] = [];

    if (page !== undefined && limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);
    }

    return executeQuery<Dentist>(sql, params);
  }

  /**
   * Get total count of dentists (excluding soft-deleted)
   */
  count(): number {
    const results = executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM dentists WHERE deleted_at IS NULL'
    );
    return results[0].count;
  }

  /**
   * Get dentist by ID (excluding soft-deleted)
   */
  findById(id: number): Dentist | null {
    const results = executeQuery<Dentist>(
      'SELECT * FROM dentists WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return results[0] || null;
  }

  /**
   * Create a new dentist
   */
  create(dto: CreateDentistDto): Dentist {
    const now = Math.floor(Date.now() / 1000);
    
    // Use executeQuery to get the inserted ID in one operation
    const results = executeQuery<Dentist>(
      `INSERT INTO dentists (name, gender, residence, phone, clinic_name, specialization, case_types, payment_terms, discount_rate, cost, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        dto.name,
        dto.gender,
        dto.residence,
        dto.phone,
        dto.clinic_name || null,
        dto.specialization || null,
        JSON.stringify(dto.case_types),
        dto.payment_terms || 'immediate',
        dto.discount_rate || 0,
        dto.cost,
        dto.notes || null,
        now,
        now,
      ] as SqlValue[]
    );

    if (!results || results.length === 0) {
      throw new Error('Failed to create dentist');
    }

    // Save database after insert
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    return results[0];
  }

  /**
   * Update a dentist
   */
  update(dto: UpdateDentistDto): Dentist {
    const existing = this.findById(dto.id);
    if (!existing) {
      throw new NotFoundError('Dentist', dto.id);
    }

    const now = Math.floor(Date.now() / 1000);
    const updates: string[] = [];
    const params: SqlValue[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      params.push(dto.name);
    }
    if (dto.gender !== undefined) {
      updates.push('gender = ?');
      params.push(dto.gender);
    }
    if (dto.residence !== undefined) {
      updates.push('residence = ?');
      params.push(dto.residence);
    }
    if (dto.phone !== undefined) {
      updates.push('phone = ?');
      params.push(dto.phone);
    }
    if (dto.clinic_name !== undefined) {
      updates.push('clinic_name = ?');
      params.push(dto.clinic_name);
    }
    if (dto.specialization !== undefined) {
      updates.push('specialization = ?');
      params.push(dto.specialization);
    }
    if (dto.case_types !== undefined) {
      updates.push('case_types = ?');
      params.push(JSON.stringify(dto.case_types));
    }
    if (dto.payment_terms !== undefined) {
      updates.push('payment_terms = ?');
      params.push(dto.payment_terms);
    }
    if (dto.discount_rate !== undefined) {
      updates.push('discount_rate = ?');
      params.push(dto.discount_rate);
    }
    if (dto.cost !== undefined) {
      updates.push('cost = ?');
      params.push(dto.cost);
    }
    if (dto.notes !== undefined) {
      updates.push('notes = ?');
      params.push(dto.notes);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(dto.id);

    executeNonQuery(
      `UPDATE dentists SET ${updates.join(', ')} WHERE id = ?`,
      params as SqlValue[]
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    const updated = this.findById(dto.id);
    if (!updated) {
      throw new Error('Failed to update dentist');
    }

    return updated;
  }

  /**
   * Soft delete a dentist
   */
  delete(id: number): void {
    const existing = this.findById(id);
    if (!existing) {
      throw new NotFoundError('Dentist', id);
    }

    const now = Math.floor(Date.now() / 1000);
    executeNonQuery(
      'UPDATE dentists SET deleted_at = ? WHERE id = ?',
      [now, id]
    );
  }

  /**
   * Restore a soft-deleted dentist
   */
  restore(id: number): Dentist {
    const results = executeQuery<Dentist>(
      'SELECT * FROM dentists WHERE id = ?',
      [id]
    );
    
    if (!results[0]) {
      throw new NotFoundError('Dentist', id);
    }

    executeNonQuery(
      'UPDATE dentists SET deleted_at = NULL WHERE id = ?',
      [id]
    );

    const restored = this.findById(id);
    if (!restored) {
      throw new Error('Failed to restore dentist');
    }

    return restored;
  }

  /**
   * Permanently delete a dentist (hard delete)
   */
  permanentDelete(id: number): void {
    executeNonQuery('DELETE FROM dentists WHERE id = ?', [id]);
  }

  /**
   * Search dentists by name or phone (excluding soft-deleted)
   */
  search(query: string): Dentist[] {
    return executeQuery<Dentist>(
      `SELECT * FROM dentists 
       WHERE (name LIKE ? OR phone LIKE ?) AND deleted_at IS NULL
       ORDER BY name ASC`,
      [`%${query}%`, `%${query}%`]
    );
  }
}