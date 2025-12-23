import { WorkerRepository } from '../repositories/WorkerRepository';
import { createWorkerSchema, updateWorkerSchema } from './schemas/worker.schema';
import { ValidationError } from '../utils/errors';
import type { Worker, CreateWorkerDto, UpdateWorkerDto } from '../../../shared/types/api.types';
import log from 'electron-log';

export class WorkerService {
  private repository: WorkerRepository;

  constructor() {
    this.repository = new WorkerRepository();
  }

  async listWorkers(page?: number, limit?: number): Promise<Worker[]> {
    try {
      log.info('WorkerService: Listing all workers', { page, limit });
      return this.repository.findAll(page, limit);
    } catch (error) {
      log.error('WorkerService: Failed to list workers', error);
      throw error;
    }
  }

  async countWorkers(): Promise<number> {
    try {
      log.info('WorkerService: Counting workers');
      return this.repository.count();
    } catch (error) {
      log.error('WorkerService: Failed to count workers', error);
      throw error;
    }
  }

  async listActiveWorkers(): Promise<Worker[]> {
    try {
      log.info('WorkerService: Listing active workers');
      return this.repository.findActive();
    } catch (error) {
      log.error('WorkerService: Failed to list active workers', error);
      throw error;
    }
  }

  async getWorker(id: number): Promise<Worker> {
    try {
      log.info(`WorkerService: Getting worker ${id}`);
      const worker = this.repository.findById(id);
      if (!worker) {
        throw new ValidationError(`Worker with id ${id} not found`);
      }
      return worker;
    } catch (error) {
      log.error(`WorkerService: Failed to get worker ${id}`, error);
      throw error;
    }
  }

  async createWorker(dto: CreateWorkerDto): Promise<Worker> {
    try {
      log.info('WorkerService: Creating worker', dto);
      
      // Validate input
      const validated = createWorkerSchema.parse(dto);
      
      const worker = this.repository.create(validated);
      log.info(`WorkerService: Created worker ${worker.id}`);
      
      return worker;
    } catch (error) {
      log.error('WorkerService: Failed to create worker', error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid worker data', error);
      }
      throw error;
    }
  }

  async updateWorker(dto: UpdateWorkerDto): Promise<Worker> {
    try {
      log.info(`WorkerService: Updating worker ${dto.id}`, dto);
      
      // Validate input
      const validated = updateWorkerSchema.parse(dto);
      
      const worker = this.repository.update(validated);
      log.info(`WorkerService: Updated worker ${worker.id}`);
      
      return worker;
    } catch (error) {
      log.error(`WorkerService: Failed to update worker ${dto.id}`, error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid worker data', error);
      }
      throw error;
    }
  }

  async deleteWorker(id: number): Promise<void> {
    try {
      log.info(`WorkerService: Deleting worker ${id}`);
      this.repository.delete(id);
      log.info(`WorkerService: Deleted worker ${id}`);
    } catch (error) {
      log.error(`WorkerService: Failed to delete worker ${id}`, error);
      throw error;
    }
  }

  async deactivateWorker(id: number): Promise<Worker> {
    try {
      log.info(`WorkerService: Deactivating worker ${id}`);
      const worker = this.repository.deactivate(id);
      log.info(`WorkerService: Deactivated worker ${id}`);
      return worker;
    } catch (error) {
      log.error(`WorkerService: Failed to deactivate worker ${id}`, error);
      throw error;
    }
  }

  async activateWorker(id: number): Promise<Worker> {
    try {
      log.info(`WorkerService: Activating worker ${id}`);
      const worker = this.repository.activate(id);
      log.info(`WorkerService: Activated worker ${id}`);
      return worker;
    } catch (error) {
      log.error(`WorkerService: Failed to activate worker ${id}`, error);
      throw error;
    }
  }
}