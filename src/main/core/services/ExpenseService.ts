import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { createExpenseSchema } from './schemas/expense.schema';
import { ValidationError } from '../utils/errors';
import type { Expense, CreateExpenseDto, ExpenseFilters } from '../../../shared/types/api.types';
import log from 'electron-log';

export class ExpenseService {
  private repository: ExpenseRepository;

  constructor() {
    this.repository = new ExpenseRepository();
  }

  async listExpenses(filters?: ExpenseFilters, page?: number, limit?: number): Promise<Expense[]> {
    try {
      log.info('ExpenseService: Listing expenses', { filters, page, limit });
      return this.repository.findAll(filters, page, limit);
    } catch (error) {
      log.error('ExpenseService: Failed to list expenses', error);
      throw error;
    }
  }

  async countExpenses(filters?: ExpenseFilters): Promise<number> {
    try {
      log.info('ExpenseService: Counting expenses', filters);
      return this.repository.count(filters);
    } catch (error) {
      log.error('ExpenseService: Failed to count expenses', error);
      throw error;
    }
  }

  async getExpense(id: number): Promise<Expense> {
    try {
      log.info(`ExpenseService: Getting expense ${id}`);
      const expense = this.repository.findById(id);
      if (!expense) {
        throw new ValidationError(`Expense with id ${id} not found`);
      }
      return expense;
    } catch (error) {
      log.error(`ExpenseService: Failed to get expense ${id}`, error);
      throw error;
    }
  }

  async createExpense(dto: CreateExpenseDto): Promise<Expense> {
    try {
      log.info('ExpenseService: Creating expense', dto);
      
      // Validate input
      const validated = createExpenseSchema.parse(dto);
      
      const expense = this.repository.create(validated);
      log.info(`ExpenseService: Created expense ${expense.id}`);
      
      return expense;
    } catch (error) {
      log.error('ExpenseService: Failed to create expense', error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid expense data', error);
      }
      throw error;
    }
  }

  async deleteExpense(id: number): Promise<void> {
    try {
      log.info(`ExpenseService: Deleting expense ${id}`);
      this.repository.delete(id);
      log.info(`ExpenseService: Deleted expense ${id}`);
    } catch (error) {
      log.error(`ExpenseService: Failed to delete expense ${id}`, error);
      throw error;
    }
  }

  async getTotalByPeriod(dateFrom: number, dateTo: number): Promise<number> {
    try {
      log.info(`ExpenseService: Getting total expenses from ${dateFrom} to ${dateTo}`);
      return this.repository.getTotalByPeriod(dateFrom, dateTo);
    } catch (error) {
      log.error('ExpenseService: Failed to get total by period', error);
      throw error;
    }
  }

  async getTotalByCategory(category: string, dateFrom?: number, dateTo?: number): Promise<number> {
    try {
      log.info(`ExpenseService: Getting total for category ${category}`);
      return this.repository.getTotalByCategory(category, dateFrom, dateTo);
    } catch (error) {
      log.error(`ExpenseService: Failed to get total for category ${category}`, error);
      throw error;
    }
  }
}