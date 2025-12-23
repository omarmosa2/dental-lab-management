import { useState, useCallback } from 'react';
import type { Expense, CreateExpenseDto, ExpenseFilters } from '../../shared/types/api.types';

export function useExpenseViewModel() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load expenses with filters and optional pagination
  const loadExpenses = useCallback(async (filters?: ExpenseFilters, page?: number, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.expenses.list(filters, page, limit);
      if (response.ok && response.data) {
        setExpenses(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل تحميل المصروفات');
        setExpenses([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل المصروفات');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total count of expenses
  const getTotalCount = useCallback(async (filters?: ExpenseFilters): Promise<number> => {
    try {
      const response = await window.api.expenses.count(filters);
      if (response.ok && typeof response.data === 'number') {
        setTotalCount(response.data);
        return response.data;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }, []);

  // Create expense
  const createExpense = useCallback(async (data: CreateExpenseDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.expenses.create(data);
      if (response.ok && response.data) {
        setExpenses((prev) => [response.data!, ...prev]);
        return true;
      } else {
        setError(response.error?.message || 'فشل إضافة المصروف');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إضافة المصروف');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete expense
  const deleteExpense = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.expenses.delete(id);
      if (response.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        return true;
      } else {
        setError(response.error?.message || 'فشل حذف المصروف');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف المصروف');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total by period
  const getTotalByPeriod = useCallback(async (startDate: number, endDate: number): Promise<number> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.expenses.getTotalByPeriod(startDate, endDate);
      if (response.ok && response.data !== undefined) {
        return response.data;
      } else {
        setError(response.error?.message || 'فشل حساب المجموع');
        return 0;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حساب المجموع');
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete expenses
  const bulkDeleteExpenses = useCallback(async (ids: number[]): Promise<{ success: number; failed: number }> => {
    setLoading(true);
    setError(null);
    let success = 0;
    let failed = 0;

    try {
      for (const id of ids) {
        const response = await window.api.expenses.delete(id);
        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      }

      if (success > 0) {
        await loadExpenses();
      }

      return { success, failed };
    } catch (err) {
      setError('حدث خطأ أثناء الحذف الجماعي');
      return { success, failed };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  return {
    expenses,
    totalCount,
    loading,
    error,
    loadExpenses,
    getTotalCount,
    createExpense,
    deleteExpense,
    getTotalByPeriod,
    bulkDeleteExpenses,
  };
}