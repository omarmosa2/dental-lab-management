import { executeQuery, executeNonQuery } from '../database/connection';
import type { SqlValue } from 'sql.js';
import type { Payment, CreatePaymentDto, PaymentFilters } from '../../../shared/types/api.types';
import { NotFoundError } from '../utils/errors';

export class PaymentRepository {
  /**
   * Get all payments with optional filters
   */
  findAll(filters?: PaymentFilters): Payment[] {
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params: SqlValue[] = [];

    if (filters?.order_id) {
      sql += ' AND order_id = ?';
      params.push(filters.order_id);
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

    return executeQuery<Payment>(sql, params);
  }

  /**
   * Get payment by ID
   */
  findById(id: number): Payment | null {
    const results = executeQuery<Payment>(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  /**
   * Get payments for an order
   */
  findByOrderId(orderId: number): Payment[] {
    return executeQuery<Payment>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY date DESC',
      [orderId]
    );
  }

  /**
   * Create a new payment
   */
  create(dto: CreatePaymentDto): Payment {
    const now = Math.floor(Date.now() / 1000);

    const results = executeQuery<Payment>(
      `INSERT INTO payments (order_id, amount, discount, date, payment_method, receipt_number, received_by, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        dto.order_id,
        dto.amount,
        dto.discount,
        dto.date,
        dto.payment_method || 'cash',
        dto.receipt_number || null,
        dto.received_by || null,
        dto.note || null,
        now,
      ] as SqlValue[]
    );

    if (!results || results.length === 0) {
      throw new Error('Failed to create payment');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();

    return results[0];
  }

  /**
   * Delete a payment
   */
  delete(id: number): void {
    const existing = this.findById(id);
    if (!existing) {
      throw new NotFoundError('Payment', id);
    }

    executeNonQuery('DELETE FROM payments WHERE id = ?', [id]);
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { saveDatabase } = require('../database/connection');
    saveDatabase();
  }

  /**
   * Get total paid for an order
   */
  getTotalPaid(orderId: number): number {
    const results = executeQuery<{ total: number }>(
      'SELECT COALESCE(SUM(amount - discount), 0) as total FROM payments WHERE order_id = ?',
      [orderId]
    );
    return results[0].total;
  }
}