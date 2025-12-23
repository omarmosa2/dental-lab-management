"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DentistService = void 0;
const DentistRepository_1 = require("../repositories/DentistRepository");
const dentist_schema_1 = require("./schemas/dentist.schema");
const errors_1 = require("../utils/errors");
const electron_log_1 = __importDefault(require("electron-log"));
class DentistService {
    constructor() {
        this.repository = new DentistRepository_1.DentistRepository();
    }
    async listDentists(page, limit) {
        try {
            electron_log_1.default.info('DentistService: Listing all dentists', { page, limit });
            return this.repository.findAll(page, limit);
        }
        catch (error) {
            electron_log_1.default.error('DentistService: Failed to list dentists', error);
            throw error;
        }
    }
    async countDentists() {
        try {
            electron_log_1.default.info('DentistService: Counting dentists');
            return this.repository.count();
        }
        catch (error) {
            electron_log_1.default.error('DentistService: Failed to count dentists', error);
            throw error;
        }
    }
    async getDentist(id) {
        try {
            electron_log_1.default.info(`DentistService: Getting dentist ${id}`);
            const dentist = this.repository.findById(id);
            if (!dentist) {
                throw new errors_1.ValidationError(`Dentist with id ${id} not found`);
            }
            return dentist;
        }
        catch (error) {
            electron_log_1.default.error(`DentistService: Failed to get dentist ${id}`, error);
            throw error;
        }
    }
    async createDentist(dto) {
        try {
            electron_log_1.default.info('DentistService: Creating dentist', dto);
            // Validate input
            const validated = dentist_schema_1.createDentistSchema.parse(dto);
            const dentist = this.repository.create(validated);
            electron_log_1.default.info(`DentistService: Created dentist ${dentist.id}`);
            return dentist;
        }
        catch (error) {
            electron_log_1.default.error('DentistService: Failed to create dentist', error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid dentist data', error);
            }
            throw error;
        }
    }
    async updateDentist(dto) {
        try {
            electron_log_1.default.info(`DentistService: Updating dentist ${dto.id}`, dto);
            // Validate input
            const validated = dentist_schema_1.updateDentistSchema.parse(dto);
            const dentist = this.repository.update(validated);
            electron_log_1.default.info(`DentistService: Updated dentist ${dentist.id}`);
            return dentist;
        }
        catch (error) {
            electron_log_1.default.error(`DentistService: Failed to update dentist ${dto.id}`, error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid dentist data', error);
            }
            throw error;
        }
    }
    async deleteDentist(id) {
        try {
            electron_log_1.default.info(`DentistService: Deleting dentist ${id}`);
            this.repository.delete(id);
            electron_log_1.default.info(`DentistService: Deleted dentist ${id}`);
        }
        catch (error) {
            electron_log_1.default.error(`DentistService: Failed to delete dentist ${id}`, error);
            throw error;
        }
    }
    async searchDentists(query) {
        try {
            electron_log_1.default.info(`DentistService: Searching dentists with query: ${query}`);
            return this.repository.search(query);
        }
        catch (error) {
            electron_log_1.default.error('DentistService: Failed to search dentists', error);
            throw error;
        }
    }
}
exports.DentistService = DentistService;
