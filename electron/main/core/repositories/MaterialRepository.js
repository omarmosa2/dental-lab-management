"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRepository = void 0;
const connection_1 = require("../database/connection");
const errors_1 = require("../utils/errors");
class MaterialRepository {
    /**
     * Get all materials (excluding soft-deleted) with optional pagination
     */
    findAll(page, limit) {
        let sql = 'SELECT * FROM materials WHERE deleted_at IS NULL ORDER BY name ASC';
        const params = [];
        if (page !== undefined && limit !== undefined) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);
        }
        return (0, connection_1.executeQuery)(sql, params);
    }
    /**
     * Get total count of materials (excluding soft-deleted)
     */
    count() {
        const results = (0, connection_1.executeQuery)('SELECT COUNT(*) as count FROM materials WHERE deleted_at IS NULL');
        return results[0].count;
    }
    /**
     * Get material by ID (excluding soft-deleted)
     */
    findById(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM materials WHERE id = ? AND deleted_at IS NULL', [id]);
        return results[0] || null;
    }
    /**
     * Get material by code (excluding soft-deleted)
     */
    findByCode(code) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM materials WHERE code = ? AND deleted_at IS NULL', [code]);
        return results[0] || null;
    }
    /**
     * Create a new material
     */
    create(dto) {
        const now = Math.floor(Date.now() / 1000);
        const results = (0, connection_1.executeQuery)(`INSERT INTO materials (code, name, quantity, min_quantity, unit, cost_per_unit, supplier, last_purchase_date, expiry_date, category, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`, [
            dto.code,
            dto.name,
            dto.quantity,
            dto.min_quantity,
            dto.unit,
            dto.cost_per_unit,
            dto.supplier || null,
            dto.last_purchase_date || null,
            dto.expiry_date || null,
            dto.category || null,
            dto.notes || null,
            now,
            now,
        ]);
        if (!results || results.length === 0) {
            throw new Error('Failed to create material');
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
        return results[0];
    }
    /**
     * Update a material
     */
    update(dto) {
        const existing = this.findById(dto.id);
        if (!existing) {
            throw new errors_1.NotFoundError('Material', dto.id);
        }
        const now = Math.floor(Date.now() / 1000);
        const updates = [];
        const params = [];
        if (dto.code !== undefined) {
            updates.push('code = ?');
            params.push(dto.code);
        }
        if (dto.name !== undefined) {
            updates.push('name = ?');
            params.push(dto.name);
        }
        if (dto.quantity !== undefined) {
            updates.push('quantity = ?');
            params.push(dto.quantity);
        }
        if (dto.min_quantity !== undefined) {
            updates.push('min_quantity = ?');
            params.push(dto.min_quantity);
        }
        if (dto.unit !== undefined) {
            updates.push('unit = ?');
            params.push(dto.unit);
        }
        if (dto.cost_per_unit !== undefined) {
            updates.push('cost_per_unit = ?');
            params.push(dto.cost_per_unit);
        }
        if (dto.supplier !== undefined) {
            updates.push('supplier = ?');
            params.push(dto.supplier);
        }
        if (dto.last_purchase_date !== undefined) {
            updates.push('last_purchase_date = ?');
            params.push(dto.last_purchase_date);
        }
        if (dto.expiry_date !== undefined) {
            updates.push('expiry_date = ?');
            params.push(dto.expiry_date);
        }
        if (dto.category !== undefined) {
            updates.push('category = ?');
            params.push(dto.category);
        }
        if (dto.notes !== undefined) {
            updates.push('notes = ?');
            params.push(dto.notes);
        }
        updates.push('updated_at = ?');
        params.push(now);
        params.push(dto.id);
        (0, connection_1.executeNonQuery)(`UPDATE materials SET ${updates.join(', ')} WHERE id = ?`, params);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveDatabase } = require('../database/connection');
        saveDatabase();
        const updated = this.findById(dto.id);
        if (!updated) {
            throw new Error('Failed to update material');
        }
        return updated;
    }
    /**
     * Soft delete a material
     */
    delete(id) {
        const existing = this.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError('Material', id);
        }
        const now = Math.floor(Date.now() / 1000);
        (0, connection_1.executeNonQuery)('UPDATE materials SET deleted_at = ? WHERE id = ?', [now, id]);
    }
    /**
     * Restore a soft-deleted material
     */
    restore(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM materials WHERE id = ?', [id]);
        if (!results[0]) {
            throw new errors_1.NotFoundError('Material', id);
        }
        (0, connection_1.executeNonQuery)('UPDATE materials SET deleted_at = NULL WHERE id = ?', [id]);
        const restored = this.findById(id);
        if (!restored) {
            throw new Error('Failed to restore material');
        }
        return restored;
    }
    /**
     * Permanently delete a material (hard delete)
     */
    permanentDelete(id) {
        (0, connection_1.executeNonQuery)('DELETE FROM materials WHERE id = ?', [id]);
    }
    /**
     * Get materials with low stock (excluding soft-deleted)
     */
    findLowStock() {
        return (0, connection_1.executeQuery)('SELECT * FROM materials WHERE quantity <= min_quantity AND deleted_at IS NULL ORDER BY name ASC');
    }
    /**
     * Update material quantity
     */
    updateQuantity(id, quantity) {
        const existing = this.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError('Material', id);
        }
        const now = Math.floor(Date.now() / 1000);
        (0, connection_1.executeNonQuery)('UPDATE materials SET quantity = ?, updated_at = ? WHERE id = ?', [quantity, now, id]);
        const updated = this.findById(id);
        if (!updated) {
            throw new Error('Failed to update material quantity');
        }
        return updated;
    }
}
exports.MaterialRepository = MaterialRepository;
