import { executeQuery, executeNonQuery } from '../database/connection';
import type { SqlValue } from 'sql.js';
import type { Expense, CreateExpenseDto, ExpenseFilters } from '../../../shared/types/api.types';
import { NotFoundError } from '../utils/errors';

export class ExpenseRepository {
  /**
   * Get all expenses with optional filters and pagination (excluding soft-deleted)
   */
  findAll(filters?: ExpenseFilters, page?: number, limit?: number): Expense[] {
    let sql = 'SELECT * FROM expenses WHERE deleted_at IS NULL';
    const params: SqlValue[] = [];

    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.date_from) {
      sql += ' AND date >= ?';
      params.push(filters.date_from);
    }
    if (filters?.date_to) {
      sql += ' AND date <= ?';
      params.push(filters.date_to);
    }

    sql += ' ORDER BY date DESC';

    if (page !== undefined && limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);
    }

    return executeQuery<Expense>(sql, params);
  }

  /**
   * Get total count of expenses (excluding soft-deleted) with optional filters
   */
  count(filters?: ExpenseFilters): number {
    let sql = 'SELECT COUNT(*) as count FROM expenses WHERE deleted_at IS NULL';
    const params: SqlValue[] = [];

    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.date_from) {
      sql += ' AND date >= ?';
      params.push(filters.date_from);
    }
    if (filters?.date_to) {
      sql += ' AND date <= ?';
      params.push(filters.date_to);
    }

    const results = executeQuery<{ count: number }>(sql, params);
    return results[0].count;
  }

  /**
   * Get expense by ID (excluding soft-deleted)
   */
  findById(id: number): Expense | null {
    const results = executeQuery<Expense>(
      'SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return results[0] || null;
  }

  /**
   * Create a new expense
   */
  create(dto: CreateExpenseDto): Expense {
    const now = Math.floor(Date.now() / 1000);

    const results = executeQuery<Expense>(
      `INSERT INTO expenses (description, amount, category, date, payment_method, receipt_number, vendor, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        dto.description,
        dto.amount,
        dto.category,
        dto.date,
        dto.payment_method || 'cash',
        dto.receipt_number || null,
        dto.vendor || null,
        dto.notes || null,
        now,
      ] as SqlValue[]
    );

    if (!results || results.length === 0) {
      throw new Error('Failed to create expense');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    return results[0];
  }

  /**
   * Soft delete an expense
   */
  delete(id: number): void {
    const existing = this.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense', id);
    }

    const now = Math.floor(Date.now() / 1000);
    executeNonQuery(
      'UPDATE expenses SET deleted_at = ? WHERE id = ?',
      [now, id]
    );
  }

  /**
   * Restore a soft-deleted expense
   */
  restore(id: number): Expense {
    const results = executeQuery<Expense>(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );
    
    if (!results[0]) {
      throw new NotFoundError('Expense', id);
    }

    executeNonQuery(
      'UPDATE expenses SET deleted_at = NULL WHERE id = ?',
      [id]
    );

    const restored = this.findById(id);
    if (!restored) {
      throw new Error('Failed to restore expense');
    }

    return restored;
  }

  /**
   * Permanently delete an expense (hard delete)
   */
  permanentDelete(id: number): void {
    executeNonQuery('DELETE FROM expenses WHERE id = ?', [id]);
  }

  /**
   * Get total expenses for a period (excluding soft-deleted)
   */
  getTotalByPeriod(dateFrom: number, dateTo: number): number {
    const results = executeQuery<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ? AND deleted_at IS NULL',
      [dateFrom, dateTo]
    );
    return results[0].total;
  }

  /**
   * Get expenses by category (excluding soft-deleted)
   */
  getTotalByCategory(category: string, dateFrom?: number, dateTo?: number): number {
    let sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category = ? AND deleted_at IS NULL';
    const params: SqlValue[] = [category];

    if (dateFrom) {
      sql += ' AND date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ' AND date <= ?';
      params.push(dateTo);
    }

    const results = executeQuery<{ total: number }>(sql, params);
    return results[0].total;
  }
}