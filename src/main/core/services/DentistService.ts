import { DentistRepository } from '../repositories/DentistRepository';
import { createDentistSchema, updateDentistSchema } from './schemas/dentist.schema';
import { ValidationError } from '../utils/errors';
import type { Dentist, CreateDentistDto, UpdateDentistDto } from '../../../shared/types/api.types';
import log from 'electron-log';

export class DentistService {
  private repository: DentistRepository;

  constructor() {
    this.repository = new DentistRepository();
  }

  async listDentists(page?: number, limit?: number): Promise<Dentist[]> {
    try {
      log.info('DentistService: Listing all dentists', { page, limit });
      return this.repository.findAll(page, limit);
    } catch (error) {
      log.error('DentistService: Failed to list dentists', error);
      throw error;
    }
  }

  async countDentists(): Promise<number> {
    try {
      log.info('DentistService: Counting dentists');
      return this.repository.count();
    } catch (error) {
      log.error('DentistService: Failed to count dentists', error);
      throw error;
    }
  }

  async getDentist(id: number): Promise<Dentist> {
    try {
      log.info(`DentistService: Getting dentist ${id}`);
      const dentist = this.repository.findById(id);
      if (!dentist) {
        throw new ValidationError(`Dentist with id ${id} not found`);
      }
      return dentist;
    } catch (error) {
      log.error(`DentistService: Failed to get dentist ${id}`, error);
      throw error;
    }
  }

  async createDentist(dto: CreateDentistDto): Promise<Dentist> {
    try {
      log.info('DentistService: Creating dentist', dto);
      
      // Validate input
      const validated = createDentistSchema.parse(dto);
      
      const dentist = this.repository.create(validated);
      log.info(`DentistService: Created dentist ${dentist.id}`);
      
      return dentist;
    } catch (error) {
      log.error('DentistService: Failed to create dentist', error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid dentist data', error);
      }
      throw error;
    }
  }

  async updateDentist(dto: UpdateDentistDto): Promise<Dentist> {
    try {
      log.info(`DentistService: Updating dentist ${dto.id}`, dto);
      
      // Validate input
      const validated = updateDentistSchema.parse(dto);
      
      const dentist = this.repository.update(validated);
      log.info(`DentistService: Updated dentist ${dentist.id}`);
      
      return dentist;
    } catch (error) {
      log.error(`DentistService: Failed to update dentist ${dto.id}`, error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid dentist data', error);
      }
      throw error;
    }
  }

  async deleteDentist(id: number): Promise<void> {
    try {
      log.info(`DentistService: Deleting dentist ${id}`);
      this.repository.delete(id);
      log.info(`DentistService: Deleted dentist ${id}`);
    } catch (error) {
      log.error(`DentistService: Failed to delete dentist ${id}`, error);
      throw error;
    }
  }

  async searchDentists(query: string): Promise<Dentist[]> {
    try {
      log.info(`DentistService: Searching dentists with query: ${query}`);
      return this.repository.search(query);
    } catch (error) {
      log.error('DentistService: Failed to search dentists', error);
      throw error;
    }
  }
}