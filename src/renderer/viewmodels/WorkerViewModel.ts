import { useState, useCallback } from 'react';
import type { Worker, CreateWorkerDto } from '../../shared/types/api.types';

export function useWorkerViewModel() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all workers with optional pagination
  const loadWorkers = useCallback(async (filters?: any, page?: number, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.list(page, limit);
      if (response.ok && response.data) {
        setWorkers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل تحميل العمال');
        setWorkers([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل العمال');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total count of workers
  const getTotalCount = useCallback(async (): Promise<number> => {
    try {
      const response = await window.api.workers.count();
      if (response.ok && typeof response.data === 'number') {
        setTotalCount(response.data);
        return response.data;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }, []);

  // Load active workers only
  const loadActiveWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.listActive();
      if (response.ok && response.data) {
        setWorkers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل تحميل العمال النشطين');
        setWorkers([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل العمال النشطين');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create worker
  const createWorker = useCallback(async (data: CreateWorkerDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.create(data);
      if (response.ok && response.data) {
        setWorkers((prev) => [...prev, response.data!]);
        return true;
      } else {
        setError(response.error?.message || 'فشل إضافة العامل');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إضافة العامل');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update worker
  const updateWorker = useCallback(async (id: number, data: Partial<CreateWorkerDto>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.update({ id, ...data } as any);
      if (response.ok) {
        setWorkers((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ...data } : w))
        );
        return true;
      } else {
        setError(response.error?.message || 'فشل تحديث بيانات العامل');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث بيانات العامل');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete worker
  const deleteWorker = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.delete(id);
      if (response.ok) {
        setWorkers((prev) => prev.filter((w) => w.id !== id));
        return true;
      } else {
        setError(response.error?.message || 'فشل حذف العامل');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف العامل');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Activate worker
  const activateWorker = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.activate(id);
      if (response.ok) {
        setWorkers((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: 'active' } : w))
        );
        return true;
      } else {
        setError(response.error?.message || 'فشل تفعيل العامل');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تفعيل العامل');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Deactivate worker
  const deactivateWorker = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.workers.deactivate(id);
      if (response.ok) {
        setWorkers((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: 'inactive' } : w))
        );
        return true;
      } else {
        setError(response.error?.message || 'فشل إيقاف العامل');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إيقاف العامل');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete workers
  const bulkDeleteWorkers = useCallback(async (ids: number[]): Promise<{ success: number; failed: number }> => {
    setLoading(true);
    setError(null);
    let success = 0;
    let failed = 0;

    try {
      for (const id of ids) {
        const response = await window.api.workers.delete(id);
        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      }

      if (success > 0) {
        await loadWorkers();
      }

      return { success, failed };
    } catch (err) {
      setError('حدث خطأ أثناء الحذف الجماعي');
      return { success, failed };
    } finally {
      setLoading(false);
    }
  }, [loadWorkers]);

  return {
    workers,
    totalCount,
    loading,
    error,
    loadWorkers,
    getTotalCount,
    loadActiveWorkers,
    createWorker,
    updateWorker,
    deleteWorker,
    activateWorker,
    deactivateWorker,
    bulkDeleteWorkers,
  };
}