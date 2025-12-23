import { useState, useCallback } from 'react';
import type { Order } from '../../shared/types/api.types';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalDentists: number;
  lowStockMaterials: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

export function useDashboardViewModel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await window.api.reports.dashboardStats();
      if (response.ok) { setStats(response.data); }
      else { setError(response.error?.message || 'فشل تحميل الإحصائيات'); }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الإحصائيات');
      console.error('Error loading dashboard stats:', err);
    } finally { setLoading(false); }
  }, []);

  const loadRecentOrders = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await window.api.reports.getRecentOrders(limit);
      if (response.ok) { setRecentOrders(response.data); }
      else { setError(response.error?.message || 'فشل تحميل الطلبات الأخيرة'); }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الطلبات الأخيرة');
      console.error('Error loading recent orders:', err);
    } finally { setLoading(false); }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadStats(), loadRecentOrders()]);
  }, [loadStats, loadRecentOrders]);

  return { stats, recentOrders, loading, error, loadStats, loadRecentOrders, loadAll };
}
