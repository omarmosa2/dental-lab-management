import { MaterialRepository } from '../repositories/MaterialRepository';
import { createMaterialSchema, updateMaterialSchema } from './schemas/material.schema';
import { ValidationError, BusinessRuleError } from '../utils/errors';
import type { Material, CreateMaterialDto, UpdateMaterialDto } from '../../../shared/types/api.types';
import log from 'electron-log';

export class MaterialService {
  private repository: MaterialRepository;

  constructor() {
    this.repository = new MaterialRepository();
  }

  async listMaterials(page?: number, limit?: number): Promise<Material[]> {
    try {
      log.info('MaterialService: Listing all materials', { page, limit });
      return this.repository.findAll(page, limit);
    } catch (error) {
      log.error('MaterialService: Failed to list materials', error);
      throw error;
    }
  }

  async countMaterials(): Promise<number> {
    try {
      log.info('MaterialService: Counting materials');
      return this.repository.count();
    } catch (error) {
      log.error('MaterialService: Failed to count materials', error);
      throw error;
    }
  }

  async getMaterial(id: number): Promise<Material> {
    try {
      log.info(`MaterialService: Getting material ${id}`);
      const material = this.repository.findById(id);
      if (!material) {
        throw new ValidationError(`Material with id ${id} not found`);
      }
      return material;
    } catch (error) {
      log.error(`MaterialService: Failed to get material ${id}`, error);
      throw error;
    }
  }

  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    try {
      log.info('MaterialService: Creating material', dto);
      
      // Validate input
      const validated = createMaterialSchema.parse(dto);
      
      // Check if code already exists
      const existing = this.repository.findByCode(validated.code);
      if (existing) {
        throw new BusinessRuleError(`Material with code ${validated.code} already exists`);
      }
      
      const material = this.repository.create(validated);
      log.info(`MaterialService: Created material ${material.id}`);
      
      return material;
    } catch (error) {
      log.error('MaterialService: Failed to create material', error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid material data', error);
      }
      throw error;
    }
  }

  async updateMaterial(dto: UpdateMaterialDto): Promise<Material> {
    try {
      log.info(`MaterialService: Updating material ${dto.id}`, dto);
      
      // Validate input
      const validated = updateMaterialSchema.parse(dto);
      
      // Check if code is being changed and if it already exists
      if (validated.code) {
        const existing = this.repository.findByCode(validated.code);
        if (existing && existing.id !== validated.id) {
          throw new BusinessRuleError(`Material with code ${validated.code} already exists`);
        }
      }
      
      const material = this.repository.update(validated);
      log.info(`MaterialService: Updated material ${material.id}`);
      
      return material;
    } catch (error) {
      log.error(`MaterialService: Failed to update material ${dto.id}`, error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid material data', error);
      }
      throw error;
    }
  }

  async deleteMaterial(id: number): Promise<void> {
    try {
      log.info(`MaterialService: Deleting material ${id}`);
      this.repository.delete(id);
      log.info(`MaterialService: Deleted material ${id}`);
    } catch (error) {
      log.error(`MaterialService: Failed to delete material ${id}`, error);
      throw error;
    }
  }

  async checkLowStock(): Promise<Material[]> {
    try {
      log.info('MaterialService: Checking low stock materials');
      return this.repository.findLowStock();
    } catch (error) {
      log.error('MaterialService: Failed to check low stock', error);
      throw error;
    }
  }

  async updateQuantity(id: number, quantity: number): Promise<Material> {
    try {
      log.info(`MaterialService: Updating quantity for material ${id} to ${quantity}`);
      
      if (quantity < 0) {
        throw new BusinessRuleError('الكمية لا يمكن أن تكون سالبة');
      }
      
      const material = this.repository.updateQuantity(id, quantity);
      log.info(`MaterialService: Updated quantity for material ${id}`);
      
      return material;
    } catch (error) {
      log.error(`MaterialService: Failed to update quantity for material ${id}`, error);
      throw error;
    }
  }
}