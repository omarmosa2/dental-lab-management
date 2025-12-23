"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerService = void 0;
const WorkerRepository_1 = require("../repositories/WorkerRepository");
const worker_schema_1 = require("./schemas/worker.schema");
const errors_1 = require("../utils/errors");
const electron_log_1 = __importDefault(require("electron-log"));
class WorkerService {
    constructor() {
        this.repository = new WorkerRepository_1.WorkerRepository();
    }
    async listWorkers(page, limit) {
        try {
            electron_log_1.default.info('WorkerService: Listing all workers', { page, limit });
            return this.repository.findAll(page, limit);
        }
        catch (error) {
            electron_log_1.default.error('WorkerService: Failed to list workers', error);
            throw error;
        }
    }
    async countWorkers() {
        try {
            electron_log_1.default.info('WorkerService: Counting workers');
            return this.repository.count();
        }
        catch (error) {
            electron_log_1.default.error('WorkerService: Failed to count workers', error);
            throw error;
        }
    }
    async listActiveWorkers() {
        try {
            electron_log_1.default.info('WorkerService: Listing active workers');
            return this.repository.findActive();
        }
        catch (error) {
            electron_log_1.default.error('WorkerService: Failed to list active workers', error);
            throw error;
        }
    }
    async getWorker(id) {
        try {
            electron_log_1.default.info(`WorkerService: Getting worker ${id}`);
            const worker = this.repository.findById(id);
            if (!worker) {
                throw new errors_1.ValidationError(`Worker with id ${id} not found`);
            }
            return worker;
        }
        catch (error) {
            electron_log_1.default.error(`WorkerService: Failed to get worker ${id}`, error);
            throw error;
        }
    }
    async createWorker(dto) {
        try {
            electron_log_1.default.info('WorkerService: Creating worker', dto);
            // Validate input
            const validated = worker_schema_1.createWorkerSchema.parse(dto);
            const worker = this.repository.create(validated);
            electron_log_1.default.info(`WorkerService: Created worker ${worker.id}`);
            return worker;
        }
        catch (error) {
            electron_log_1.default.error('WorkerService: Failed to create worker', error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid worker data', error);
            }
            throw error;
        }
    }
    async updateWorker(dto) {
        try {
            electron_log_1.default.info(`WorkerService: Updating worker ${dto.id}`, dto);
            // Validate input
            const validated = worker_schema_1.updateWorkerSchema.parse(dto);
            const worker = this.repository.update(validated);
            electron_log_1.default.info(`WorkerService: Updated worker ${worker.id}`);
            return worker;
        }
        catch (error) {
            electron_log_1.default.error(`WorkerService: Failed to update worker ${dto.id}`, error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid worker data', error);
            }
            throw error;
        }
    }
    async deleteWorker(id) {
        try {
            electron_log_1.default.info(`WorkerService: Deleting worker ${id}`);
            this.repository.delete(id);
            electron_log_1.default.info(`WorkerService: Deleted worker ${id}`);
        }
        catch (error) {
            electron_log_1.default.error(`WorkerService: Failed to delete worker ${id}`, error);
            throw error;
        }
    }
    async deactivateWorker(id) {
        try {
            electron_log_1.default.info(`WorkerService: Deactivating worker ${id}`);
            const worker = this.repository.deactivate(id);
            electron_log_1.default.info(`WorkerService: Deactivated worker ${id}`);
            return worker;
        }
        catch (error) {
            electron_log_1.default.error(`WorkerService: Failed to deactivate worker ${id}`, error);
            throw error;
        }
    }
    async activateWorker(id) {
        try {
            electron_log_1.default.info(`WorkerService: Activating worker ${id}`);
            const worker = this.repository.activate(id);
            electron_log_1.default.info(`WorkerService: Activated worker ${id}`);
            return worker;
        }
        catch (error) {
            electron_log_1.default.error(`WorkerService: Failed to activate worker ${id}`, error);
            throw error;
        }
    }
}
exports.WorkerService = WorkerService;
