"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const connection_1 = require("../database/connection");
const errors_1 = require("../utils/errors");
class PaymentRepository {
    /**
     * Get all payments with optional filters
     */
    findAll(filters) {
        let sql = 'SELECT * FROM payments WHERE 1=1';
        const params = [];
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
        return (0, connection_1.executeQuery)(sql, params);
    }
    /**
     * Get payment by ID
     */
    findById(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM payments WHERE id = ?', [id]);
        return results[0] || null;
    }
    /**
     * Get payments for an order
     */
    findByOrderId(orderId) {
        return (0, connection_1.executeQuery)('SELECT * FROM payments WHERE order_id = ? ORDER BY date DESC', [orderId]);
    }
    /**
     * Create a new payment
     */
    create(dto) {
        const now = Math.floor(Date.now() / 1000);
        const results = (0, connection_1.executeQuery)(`INSERT INTO payments (order_id, amount, discount, date, payment_method, receipt_number, received_by, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`, [
            dto.order_id,
            dto.amount,
            dto.discount,
            dto.date,
            dto.payment_method || 'cash',
            dto.receipt_number || null,
            dto.received_by || null,
            dto.note || null,
            now,
        ]);
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
    delete(id) {
        const existing = this.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError('Payment', id);
        }
        (0, connection_1.executeNonQuery)('DELETE FROM payments WHERE id = ?', [id]);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
    }
    /**
     * Get total paid for an order
     */
    getTotalPaid(orderId) {
        const results = (0, connection_1.executeQuery)('SELECT COALESCE(SUM(amount - discount), 0) as total FROM payments WHERE order_id = ?', [orderId]);
        return results[0].total;
    }
}
exports.PaymentRepository = PaymentRepository;
