import { useState, useCallback } from 'react';
import type { Order, CreateOrderDto, OrderFilters } from '../../shared/types/api.types';

export function useOrderViewModel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastFilters, setLastFilters] = useState<OrderFilters | undefined>(undefined);
  const [lastPage, setLastPage] = useState(1);
  const [lastLimit, setLastLimit] = useState(10);

  // Load orders with filters and pagination
  const loadOrders = useCallback(async (filters?: OrderFilters, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    setLastFilters(filters);
    setLastPage(page);
    setLastLimit(limit);
    try {
      const response = await window.api.orders.list(filters, { page, limit });
      if (response.ok && response.data) {
        // OrderService returns { orders: Order[], total: number }
        const data = response.data as any;
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setTotalCount(data.total || 0);
        } else {
          // Fallback: if data is already an array
          setOrders(Array.isArray(response.data) ? response.data : []);
          setTotalCount(Array.isArray(response.data) ? response.data.length : 0);
        }
      } else {
        setError(response.error?.message || 'فشل تحميل الطلبات');
        setOrders([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الطلبات');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single order
  const getOrder = useCallback(async (id: number): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.orders.get(id);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'فشل تحميل بيانات الطلب');
        return null;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل بيانات الطلب');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create order
  const createOrder = useCallback(async (data: CreateOrderDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.orders.create(data);
      if (response.ok && response.data) {
        // Reload orders with last filters
        await loadOrders(lastFilters, lastPage, lastLimit);
        return true;
      } else {
        setError(response.error?.message || 'فشل إضافة الطلب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إضافة الطلب');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadOrders, lastFilters, lastPage, lastLimit]);

  // Update order
  const updateOrder = useCallback(async (id: number, data: Partial<CreateOrderDto>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.orders.update(id, data);
      if (response.ok) {
        // Reload orders with last filters
        await loadOrders(lastFilters, lastPage, lastLimit);
        return true;
      } else {
        setError(response.error?.message || 'فشل تحديث بيانات الطلب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحديث بيانات الطلب');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadOrders, lastFilters, lastPage, lastLimit]);

  // Delete order
  const deleteOrder = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.orders.delete(id);
      if (response.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setTotalCount((prev) => prev - 1);
        return true;
      } else {
        setError(response.error?.message || 'فشل حذف الطلب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف الطلب');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Change order status
  const changeStatus = useCallback(async (id: number, status: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.orders.changeStatus(id, status);
      if (response.ok) {
        // Reload orders with last filters
        await loadOrders(lastFilters, lastPage, lastLimit);
        return true;
      } else {
        setError(response.error?.message || 'فشل تغيير حالة الطلب');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء تغيير حالة الطلب');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadOrders, lastFilters, lastPage, lastLimit]);

  // Bulk delete orders
  const bulkDeleteOrders = useCallback(async (ids: number[]): Promise<{ success: number; failed: number }> => {
    setLoading(true);
    setError(null);
    let success = 0;
    let failed = 0;

    try {
      for (const id of ids) {
        const response = await window.api.orders.delete(id);
        if (response.ok) {
          success++;
        } else {
          failed++;
        }
      }

      if (success > 0) {
        await loadOrders(lastFilters, lastPage, lastLimit);
      }

      return { success, failed };
    } catch (err) {
      setError('حدث خطأ أثناء الحذف الجماعي');
      return { success, failed };
    } finally {
      setLoading(false);
    }
  }, [loadOrders, lastFilters, lastPage, lastLimit]);

  return {
    orders,
    loading,
    error,
    totalCount,
    loadOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    changeStatus,
    bulkDeleteOrders,
  };
}