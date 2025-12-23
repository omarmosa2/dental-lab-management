"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const ExpenseRepository_1 = require("../repositories/ExpenseRepository");
const expense_schema_1 = require("./schemas/expense.schema");
const errors_1 = require("../utils/errors");
const electron_log_1 = __importDefault(require("electron-log"));
class ExpenseService {
    constructor() {
        this.repository = new ExpenseRepository_1.ExpenseRepository();
    }
    async listExpenses(filters, page, limit) {
        try {
            electron_log_1.default.info('ExpenseService: Listing expenses', { filters, page, limit });
            return this.repository.findAll(filters, page, limit);
        }
        catch (error) {
            electron_log_1.default.error('ExpenseService: Failed to list expenses', error);
            throw error;
        }
    }
    async countExpenses(filters) {
        try {
            electron_log_1.default.info('ExpenseService: Counting expenses', filters);
            return this.repository.count(filters);
        }
        catch (error) {
            electron_log_1.default.error('ExpenseService: Failed to count expenses', error);
            throw error;
        }
    }
    async getExpense(id) {
        try {
            electron_log_1.default.info(`ExpenseService: Getting expense ${id}`);
            const expense = this.repository.findById(id);
            if (!expense) {
                throw new errors_1.ValidationError(`Expense with id ${id} not found`);
            }
            return expense;
        }
        catch (error) {
            electron_log_1.default.error(`ExpenseService: Failed to get expense ${id}`, error);
            throw error;
        }
    }
    async createExpense(dto) {
        try {
            electron_log_1.default.info('ExpenseService: Creating expense', dto);
            // Validate input
            const validated = expense_schema_1.createExpenseSchema.parse(dto);
            const expense = this.repository.create(validated);
            electron_log_1.default.info(`ExpenseService: Created expense ${expense.id}`);
            return expense;
        }
        catch (error) {
            electron_log_1.default.error('ExpenseService: Failed to create expense', error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid expense data', error);
            }
            throw error;
        }
    }
    async deleteExpense(id) {
        try {
            electron_log_1.default.info(`ExpenseService: Deleting expense ${id}`);
            this.repository.delete(id);
            electron_log_1.default.info(`ExpenseService: Deleted expense ${id}`);
        }
        catch (error) {
            electron_log_1.default.error(`ExpenseService: Failed to delete expense ${id}`, error);
            throw error;
        }
    }
    async getTotalByPeriod(dateFrom, dateTo) {
        try {
            electron_log_1.default.info(`ExpenseService: Getting total expenses from ${dateFrom} to ${dateTo}`);
            return this.repository.getTotalByPeriod(dateFrom, dateTo);
        }
        catch (error) {
            electron_log_1.default.error('ExpenseService: Failed to get total by period', error);
            throw error;
        }
    }
    async getTotalByCategory(category, dateFrom, dateTo) {
        try {
            electron_log_1.default.info(`ExpenseService: Getting total for category ${category}`);
            return this.repository.getTotalByCategory(category, dateFrom, dateTo);
        }
        catch (error) {
            electron_log_1.default.error(`ExpenseService: Failed to get total for category ${category}`, error);
            throw error;
        }
    }
}
exports.ExpenseService = ExpenseService;
