"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const connection_1 = require("../database/connection");
const errors_1 = require("../utils/errors");
class OrderRepository {
    /**
     * Generate unique order number
     */
    generateOrderNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        // Get count of orders today
        const startOfDay = Math.floor(new Date(year, now.getMonth(), now.getDate()).getTime() / 1000);
        const endOfDay = startOfDay + 86400;
        const results = (0, connection_1.executeQuery)('SELECT COUNT(*) as count FROM orders WHERE date_received >= ? AND date_received < ?', [startOfDay, endOfDay]);
        const count = results[0].count + 1;
        return `ORD-${year}${month}${day}-${String(count).padStart(4, '0')}`;
    }
    /**
     * Get all orders with optional filters and pagination (excluding soft-deleted)
     */
    findAll(filters, pagination) {
        let sql = 'SELECT * FROM orders WHERE deleted_at IS NULL';
        const params = [];
        if (filters?.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters?.dentist_id) {
            sql += ' AND dentist_id = ?';
            params.push(filters.dentist_id);
        }
        if (filters?.date_from) {
            sql += ' AND date_received >= ?';
            params.push(filters.date_from);
        }
        if (filters?.date_to) {
            sql += ' AND date_received <= ?';
            params.push(filters.date_to);
        }
        if (filters?.search) {
            sql += ' AND (order_number LIKE ? OR notes LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        sql += ' ORDER BY date_received DESC';
        if (pagination) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(pagination.limit, (pagination.page - 1) * pagination.limit);
        }
        return (0, connection_1.executeQuery)(sql, params);
    }
    /**
     * Get order by ID (excluding soft-deleted)
     */
    findById(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', [id]);
        return results[0] || null;
    }
    /**
     * Get order by order number (excluding soft-deleted)
     */
    findByOrderNumber(orderNumber) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM orders WHERE order_number = ? AND deleted_at IS NULL', [orderNumber]);
        return results[0] || null;
    }
    /**
     * Create a new order
     */
    create(dto) {
        const now = Math.floor(Date.now() / 1000);
        const orderNumber = this.generateOrderNumber();
        const results = (0, connection_1.executeQuery)(`INSERT INTO orders (
        order_number, dentist_id, case_type, tooth_numbers, shade, 
        main_material, finish_type, notes, quantity, date_received, 
        date_due, urgency_level, warranty_period, try_in_date, remake_reason,
        price, assigned_worker_id, status, revision_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`, [
            orderNumber,
            dto.dentist_id,
            dto.case_type,
            JSON.stringify(dto.tooth_numbers),
            dto.shade,
            dto.main_material,
            dto.finish_type,
            dto.notes || null,
            dto.quantity,
            dto.date_received,
            dto.date_due,
            dto.urgency_level || 'normal',
            dto.warranty_period || 0,
            dto.try_in_date || null,
            dto.remake_reason || null,
            dto.price,
            dto.assigned_worker_id || null,
            'pending',
            0,
            now,
            now,
        ]);
        if (!results || results.length === 0) {
            throw new Error('Failed to create order');
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
        return results[0];
    }
    /**
     * Update an order
     */
    update(dto) {
        const existing = this.findById(dto.id);
        if (!existing) {
            throw new errors_1.NotFoundError('Order', dto.id);
        }
        const now = Math.floor(Date.now() / 1000);
        const updates = [];
        const params = [];
        if (dto.dentist_id !== undefined) {
            updates.push('dentist_id = ?');
            params.push(dto.dentist_id);
        }
        if (dto.case_type !== undefined) {
            updates.push('case_type = ?');
            params.push(dto.case_type);
        }
        if (dto.tooth_numbers !== undefined) {
            updates.push('tooth_numbers = ?');
            params.push(JSON.stringify(dto.tooth_numbers));
        }
        if (dto.shade !== undefined) {
            updates.push('shade = ?');
            params.push(dto.shade);
        }
        if (dto.main_material !== undefined) {
            updates.push('main_material = ?');
            params.push(dto.main_material);
        }
        if (dto.finish_type !== undefined) {
            updates.push('finish_type = ?');
            params.push(dto.finish_type);
        }
        if (dto.notes !== undefined) {
            updates.push('notes = ?');
            params.push(dto.notes);
        }
        if (dto.quantity !== undefined) {
            updates.push('quantity = ?');
            params.push(dto.quantity);
        }
        if (dto.date_received !== undefined) {
            updates.push('date_received = ?');
            params.push(dto.date_received);
        }
        if (dto.date_due !== undefined) {
            updates.push('date_due = ?');
            params.push(dto.date_due);
        }
        if (dto.price !== undefined) {
            updates.push('price = ?');
            params.push(dto.price);
        }
        if (dto.assigned_worker_id !== undefined) {
            updates.push('assigned_worker_id = ?');
            params.push(dto.assigned_worker_id);
        }
        if (dto.status !== undefined) {
            updates.push('status = ?');
            params.push(dto.status);
        }
        if (dto.date_delivered !== undefined) {
            updates.push('date_delivered = ?');
            params.push(dto.date_delivered);
        }
        if (dto.urgency_level !== undefined) {
            updates.push('urgency_level = ?');
            params.push(dto.urgency_level);
        }
        if (dto.warranty_period !== undefined) {
            updates.push('warranty_period = ?');
            params.push(dto.warranty_period);
        }
        if (dto.revision_count !== undefined) {
            updates.push('revision_count = ?');
            params.push(dto.revision_count);
        }
        if (dto.try_in_date !== undefined) {
            updates.push('try_in_date = ?');
            params.push(dto.try_in_date);
        }
        if (dto.remake_reason !== undefined) {
            updates.push('remake_reason = ?');
            params.push(dto.remake_reason);
        }
        updates.push('updated_at = ?');
        params.push(now);
        params.push(dto.id);
        (0, connection_1.executeNonQuery)(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
        const updated = this.findById(dto.id);
        if (!updated) {
            throw new Error('Failed to update order');
        }
        return updated;
    }
    /**
     * Soft delete an order
     */
    delete(id) {
        const existing = this.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError('Order', id);
        }
        const now = Math.floor(Date.now() / 1000);
        (0, connection_1.executeNonQuery)('UPDATE orders SET deleted_at = ? WHERE id = ?', [now, id]);
    }
    /**
     * Restore a soft-deleted order
     */
    restore(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM orders WHERE id = ?', [id]);
        if (!results[0]) {
            throw new errors_1.NotFoundError('Order', id);
        }
        (0, connection_1.executeNonQuery)('UPDATE orders SET deleted_at = NULL WHERE id = ?', [id]);
        const restored = this.findById(id);
        if (!restored) {
            throw new Error('Failed to restore order');
        }
        return restored;
    }
    /**
     * Permanently delete an order (hard delete)
     */
    permanentDelete(id) {
        (0, connection_1.executeNonQuery)('DELETE FROM orders WHERE id = ?', [id]);
    }
    /**
     * Get orders count (excluding soft-deleted)
     */
    count(filters) {
        let sql = 'SELECT COUNT(*) as count FROM orders WHERE deleted_at IS NULL';
        const params = [];
        if (filters?.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters?.dentist_id) {
            sql += ' AND dentist_id = ?';
            params.push(filters.dentist_id);
        }
        if (filters?.date_from) {
            sql += ' AND date_received >= ?';
            params.push(filters.date_from);
        }
        if (filters?.date_to) {
            sql += ' AND date_received <= ?';
            params.push(filters.date_to);
        }
        const results = (0, connection_1.executeQuery)(sql, params);
        return results[0].count;
    }
}
exports.OrderRepository = OrderRepository;
