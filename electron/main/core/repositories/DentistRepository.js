"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DentistRepository = void 0;
const connection_1 = require("../database/connection");
const errors_1 = require("../utils/errors");
class DentistRepository {
    /**
     * Get all dentists (excluding soft-deleted) with optional pagination
     */
    findAll(page, limit) {
        let sql = 'SELECT * FROM dentists WHERE deleted_at IS NULL ORDER BY name ASC';
        const params = [];
        if (page !== undefined && limit !== undefined) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, (page - 1) * limit);
        }
        return (0, connection_1.executeQuery)(sql, params);
    }
    /**
     * Get total count of dentists (excluding soft-deleted)
     */
    count() {
        const results = (0, connection_1.executeQuery)('SELECT COUNT(*) as count FROM dentists WHERE deleted_at IS NULL');
        return results[0].count;
    }
    /**
     * Get dentist by ID (excluding soft-deleted)
     */
    findById(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM dentists WHERE id = ? AND deleted_at IS NULL', [id]);
        return results[0] || null;
    }
    /**
     * Create a new dentist
     */
    create(dto) {
        const now = Math.floor(Date.now() / 1000);
        // Use executeQuery to get the inserted ID in one operation
        const results = (0, connection_1.executeQuery)(`INSERT INTO dentists (name, gender, residence, phone, clinic_name, specialization, case_types, payment_terms, discount_rate, cost, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`, [
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
        ]);
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
    update(dto) {
        const existing = this.findById(dto.id);
        if (!existing) {
            throw new errors_1.NotFoundError('Dentist', dto.id);
        }
        const now = Math.floor(Date.now() / 1000);
        const updates = [];
        const params = [];
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
        (0, connection_1.executeNonQuery)(`UPDATE dentists SET ${updates.join(', ')} WHERE id = ?`, params);
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
    delete(id) {
        const existing = this.findById(id);
        if (!existing) {
            throw new errors_1.NotFoundError('Dentist', id);
        }
        const now = Math.floor(Date.now() / 1000);
        (0, connection_1.executeNonQuery)('UPDATE dentists SET deleted_at = ? WHERE id = ?', [now, id]);
    }
    /**
     * Restore a soft-deleted dentist
     */
    restore(id) {
        const results = (0, connection_1.executeQuery)('SELECT * FROM dentists WHERE id = ?', [id]);
        if (!results[0]) {
            throw new errors_1.NotFoundError('Dentist', id);
        }
        (0, connection_1.executeNonQuery)('UPDATE dentists SET deleted_at = NULL WHERE id = ?', [id]);
        const restored = this.findById(id);
        if (!restored) {
            throw new Error('Failed to restore dentist');
        }
        return restored;
    }
    /**
     * Permanently delete a dentist (hard delete)
     */
    permanentDelete(id) {
        (0, connection_1.executeNonQuery)('DELETE FROM dentists WHERE id = ?', [id]);
    }
    /**
     * Search dentists by name or phone (excluding soft-deleted)
     */
    search(query) {
        return (0, connection_1.executeQuery)(`SELECT * FROM dentists 
       WHERE (name LIKE ? OR phone LIKE ?) AND deleted_at IS NULL
       ORDER BY name ASC`, [`%${query}%`, `%${query}%`]);
    }
}
exports.DentistRepository = DentistRepository;
