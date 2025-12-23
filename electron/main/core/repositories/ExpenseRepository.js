"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseRepository = void 0;
const connection_1 = require("../database/connection");
const errors_1 = require("../utils/errors");
class ExpenseRepository {
    /**
     * Get all expenses with optional filters and pagination (excluding soft-deleted)
     */
    findAll(filters, page, limit) {
        let sql = 'SELECT * FROM expenses WHERE deleted_at IS NULL';
        const params = [];
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
        return (0, connection_1.executeQuery)(sql, params);
    }
    /**
     * Get total count of expenses (excluding soft-deleted) with optional filters
     */
    count(filters) {
        let sql = 'SELECT COUNT(*) as count FROM expenses WHERE deleted_at IS NULL';
        const params = [];
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
        const results = (0, connection_1.executeQuery)(sql, params);
        return results[0].count;
    }
    /**
     * Get expense by ID (excluding soft-deleted)
     */
    findById(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL', [id]);
        return results[0] || null;
    }
    /**
     * Create a new expense
     */
    create(dto) {
        const now = Math.floor(Date.now() / 1000);
        const results = (0, connection_1.executeQuery)(`INSERT INTO expenses (description, amount, category, date, payment_method, receipt_number, vendor, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`, [
            dto.description,
            dto.amount,
            dto.category,
            dto.date,
            dto.payment_method || 'cash',
            dto.receipt_number || null,
            dto.vendor || null,
            dto.notes || null,
            now,
        ]);
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
    delete(id) {
        const existing = this.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError('Expense', id);
        }
        const now = Math.floor(Date.now() / 1000);
        (0, connection_1.executeNonQuery)('UPDATE expenses SET deleted_at = ? WHERE id = ?', [now, id]);
    }
    /**
     * Restore a soft-deleted expense
     */
    restore(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM expenses WHERE id = ?', [id]);
        if (!results[0]) {
            throw new errors_1.NotFoundError('Expense', id);
        }
        (0, connection_1.executeNonQuery)('UPDATE expenses SET deleted_at = NULL WHERE id = ?', [id]);
        const restored = this.findById(id);
        if (!restored) {
            throw new Error('Failed to restore expense');
        }
        return restored;
    }
    /**
     * Permanently delete an expense (hard delete)
     */
    permanentDelete(id) {
        (0, connection_1.executeNonQuery)('DELETE FROM expenses WHERE id = ?', [id]);
    }
    /**
     * Get total expenses for a period (excluding soft-deleted)
     */
    getTotalByPeriod(dateFrom, dateTo) {
        const results = (0, connection_1.executeQuery)('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ? AND date <= ? AND deleted_at IS NULL', [dateFrom, dateTo]);
        return results[0].total;
    }
    /**
     * Get expenses by category (excluding soft-deleted)
     */
    getTotalByCategory(category, dateFrom, dateTo) {
        let sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category = ? AND deleted_at IS NULL';
        const params = [category];
        if (dateFrom) {
            sql += ' AND date >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            sql += ' AND date <= ?';
            params.push(dateTo);
        }
        const results = (0, connection_1.executeQuery)(sql, params);
        return results[0].total;
    }
}
exports.ExpenseRepository = ExpenseRepository;
