import { useState, useCallback } from 'react';
import type { Dentist, CreateDentistDto, UpdateDentistDto } from '../../shared/types/api.types';

export interface DentistFilters {
  search?: string;
  gender?: string;
}

export function useDentistViewModel() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all dentists with optional pagination
  const loadDentists = useCallback(async (filters?: DentistFilters, page?: number, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.dentists.list(page, limit);
      if (response.ok && response.data) {
        setDentists(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل تحميل الأطباء');
        setDentists([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الأطباء');
      setDentists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total count of dentists
  const getTotalCount = useCallback(async (): Promise<number> => {
    try {
      const response = await window.api.dentists.count();
      if (response.ok && typeof response.data === 'number') {
        setTotalCount(response.data);
        return response.data;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }, []);

  // Get single dentist
  const getDentist = useCallback(async (id: number): Promise<Dentist | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.dentists.get(id);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'فشل تحميل بيانات الطبيب');
        return null;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل بيانات الطبيب');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create dentist
  const createDentist = useCallback(async (data: CreateDentistDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.dentists.create(data);
      if (response.ok && response.data) {
        setDentists((prev) => [...prev, response.data!]);
        return true;
      } else {
        setError(response.error?.message || 'فشل إضافة الطبيب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إضافة الطبيب');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update dentist
  const updateDentist = useCallback(async (id: number, data: Partial<CreateDentistDto>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.dentists.update({ id, ...data } as any);
      if (response.ok) {
        // Reload dentists to get updated data
        await loadDentists();
        return true;
      } else {
        setError(response.error?.message || 'فشل تحديث بيانات الطبيب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث بيانات الطبيب');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete dentist
  const deleteDentist = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.dentists.delete(id);
      if (response.ok) {
        setDentists((prev) => prev.filter((d) => d.id !== id));
        return true;
      } else {
        setError(response.error?.message || 'فشل حذف الطبيب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف الطبيب');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search dentists
  const searchDentists = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.dentists.search(query);
      if (response.ok && response.data) {
        setDentists(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل البحث عن الأطباء');
        setDentists([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث');
      setDentists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete dentists
  const bulkDeleteDentists = useCallback(async (ids: number[]): Promise<{ success: number; failed: number }> => {
    setLoading(true);
    setError(null);
    let success = 0;
    let failed = 0;

    try {
      for (const id of ids) {
        const response = await window.api.dentists.delete(id);
        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      }

      // Reload dentists after bulk delete
      if (success > 0) {
        await loadDentists();
      }

      return { success, failed };
    } catch (err) {
      setError('حدث خطأ أثناء الحذف الجماعي');
      return { success, failed };
    } finally {
      setLoading(false);
    }
  }, [loadDentists]);

  return {
    dentists,
    totalCount,
    loading,
    error,
    loadDentists,
    getTotalCount,
    getDentist,
    createDentist,
    updateDentist,
    deleteDentist,
    searchDentists,
    bulkDeleteDentists,
  };
}