import { useState, useCallback } from 'react';
import type { Material, CreateMaterialDto } from '../../shared/types/api.types';

export function useMaterialViewModel() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all materials with optional pagination
  const loadMaterials = useCallback(async (filters?: any, page?: number, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.materials.list(page, limit);
      if (response.ok && response.data) {
        setMaterials(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل تحميل المواد');
        setMaterials([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل المواد');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get total count of materials
  const getTotalCount = useCallback(async (): Promise<number> => {
    try {
      const response = await window.api.materials.count();
      if (response.ok && typeof response.data === 'number') {
        setTotalCount(response.data);
        return response.data;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }, []);

  // Get low stock materials
  const getLowStock = useCallback(async (): Promise<Material[]> => {
    // Don't set loading state for low stock check to avoid UI flickering
    try {
      const response = await window.api.materials.lowStock();
      if (response.ok && response.data) {
        return response.data;
      } else {
        // Don't set error for low stock check - it's not critical
        console.warn('Failed to load low stock materials:', response.error?.message);
        return [];
      }
    } catch (err) {
      // Don't set error for low stock check - it's not critical
      console.warn('Error loading low stock materials:', err);
      return [];
    }
  }, []);

  // Create material
  const createMaterial = useCallback(async (data: CreateMaterialDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.materials.create(data);
      if (response.ok && response.data) {
        setMaterials((prev) => [...prev, response.data!]);
        return true;
      } else {
        setError(response.error?.message || 'فشل إضافة المادة');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إضافة المادة');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update material
  const updateMaterial = useCallback(async (id: number, data: Partial<CreateMaterialDto>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.materials.update({ id, ...data } as any);
      if (response.ok) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, ...data } : m))
        );
        return true;
      } else {
        setError(response.error?.message || 'فشل تحديث بيانات المادة');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث بيانات المادة');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete material
  const deleteMaterial = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.materials.delete(id);
      if (response.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        return true;
      } else {
        setError(response.error?.message || 'فشل حذف المادة');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف المادة');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update quantity
  const updateQuantity = useCallback(async (id: number, quantity: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.materials.updateQuantity(id, quantity);
      if (response.ok) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === id ? { ...m, quantity } : m))
        );
        return true;
      } else {
        setError(response.error?.message || 'فشل تحديث الكمية');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث الكمية');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete materials
  const bulkDeleteMaterials = useCallback(async (ids: number[]): Promise<{ success: number; failed: number }> => {
    setLoading(true);
    setError(null);
    let success = 0;
    let failed = 0;

    try {
      for (const id of ids) {
        const response = await window.api.materials.delete(id);
        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      }

      if (success > 0) {
        await loadMaterials();
      }

      return { success, failed };
    } catch (err) {
      setError('حدث خطأ أثناء الحذف الجماعي');
      return { success, failed };
    } finally {
      setLoading(false);
    }
  }, [loadMaterials]);

  return {
    materials,
    totalCount,
    loading,
    error,
    loadMaterials,
    getTotalCount,
    getLowStock,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    updateQuantity,
    bulkDeleteMaterials,
  };
}