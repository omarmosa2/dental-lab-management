"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialService = void 0;
const MaterialRepository_1 = require("../repositories/MaterialRepository");
const material_schema_1 = require("./schemas/material.schema");
const errors_1 = require("../utils/errors");
const electron_log_1 = __importDefault(require("electron-log"));
class MaterialService {
    constructor() {
        this.repository = new MaterialRepository_1.MaterialRepository();
    }
    async listMaterials(page, limit) {
        try {
            electron_log_1.default.info('MaterialService: Listing all materials', { page, limit });
            return this.repository.findAll(page, limit);
        }
        catch (error) {
            electron_log_1.default.error('MaterialService: Failed to list materials', error);
            throw error;
        }
    }
    async countMaterials() {
        try {
            electron_log_1.default.info('MaterialService: Counting materials');
            return this.repository.count();
        }
        catch (error) {
            electron_log_1.default.error('MaterialService: Failed to count materials', error);
            throw error;
        }
    }
    async getMaterial(id) {
        try {
            electron_log_1.default.info(`MaterialService: Getting material ${id}`);
            const material = this.repository.findById(id);
            if (!material) {
                throw new errors_1.ValidationError(`Material with id ${id} not found`);
            }
            return material;
        }
        catch (error) {
            electron_log_1.default.error(`MaterialService: Failed to get material ${id}`, error);
            throw error;
        }
    }
    async createMaterial(dto) {
        try {
            electron_log_1.default.info('MaterialService: Creating material', dto);
            // Validate input
            const validated = material_schema_1.createMaterialSchema.parse(dto);
            // Check if code already exists
            const existing = this.repository.findByCode(validated.code);
            if (existing) {
                throw new errors_1.BusinessRuleError(`Material with code ${validated.code} already exists`);
            }
            const material = this.repository.create(validated);
            electron_log_1.default.info(`MaterialService: Created material ${material.id}`);
            return material;
        }
        catch (error) {
            electron_log_1.default.error('MaterialService: Failed to create material', error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid material data', error);
            }
            throw error;
        }
    }
    async updateMaterial(dto) {
        try {
            electron_log_1.default.info(`MaterialService: Updating material ${dto.id}`, dto);
            // Validate input
            const validated = material_schema_1.updateMaterialSchema.parse(dto);
            // Check if code is being changed and if it already exists
            if (validated.code) {
                const existing = this.repository.findByCode(validated.code);
                if (existing && existing.id !== validated.id) {
                    throw new errors_1.BusinessRuleError(`Material with code ${validated.code} already exists`);
                }
            }
            const material = this.repository.update(validated);
            electron_log_1.default.info(`MaterialService: Updated material ${material.id}`);
            return material;
        }
        catch (error) {
            electron_log_1.default.error(`MaterialService: Failed to update material ${dto.id}`, error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid material data', error);
            }
            throw error;
        }
    }
    async deleteMaterial(id) {
        try {
            electron_log_1.default.info(`MaterialService: Deleting material ${id}`);
            this.repository.delete(id);
            electron_log_1.default.info(`MaterialService: Deleted material ${id}`);
        }
        catch (error) {
            electron_log_1.default.error(`MaterialService: Failed to delete material ${id}`, error);
            throw error;
        }
    }
    async checkLowStock() {
        try {
            electron_log_1.default.info('MaterialService: Checking low stock materials');
            return this.repository.findLowStock();
        }
        catch (error) {
            electron_log_1.default.error('MaterialService: Failed to check low stock', error);
            throw error;
        }
    }
    async updateQuantity(id, quantity) {
        try {
            electron_log_1.default.info(`MaterialService: Updating quantity for material ${id} to ${quantity}`);
            if (quantity < 0) {
                throw new errors_1.BusinessRuleError('الكمية لا يمكن أن تكون سالبة');
            }
            const material = this.repository.updateQuantity(id, quantity);
            electron_log_1.default.info(`MaterialService: Updated quantity for material ${id}`);
            return material;
        }
        catch (error) {
            electron_log_1.default.error(`MaterialService: Failed to update quantity for material ${id}`, error);
            throw error;
        }
    }
}
exports.MaterialService = MaterialService;
