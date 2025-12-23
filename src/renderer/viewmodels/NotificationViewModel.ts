import { useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationSummary } from '../../shared/types/notification.types';

export function useNotificationViewModel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({
    total: 0,
    unread: 0,
    byType: {
      new_order: 0,
      overdue_order: 0,
      low_stock: 0,
      pending_payment: 0,
      order_completed: 0,
      system: 0,
    },
  });
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Get overdue orders
      const now = Math.floor(Date.now() / 1000);
      const ordersResponse = await window.api.orders.list({
        status: 'in_progress',
      });

      const newNotifications: Notification[] = [];

      if (ordersResponse.ok && ordersResponse.data) {
        const overdueOrders = ordersResponse.data.orders.filter(
          (order) => order.date_due < now && order.status !== 'delivered'
        );

        overdueOrders.forEach((order) => {
          newNotifications.push({
            id: `overdue-${order.id}`,
            type: 'overdue_order',
            title: 'طلب متأخر',
            message: `الطلب #${order.order_number} متأخر عن موعد التسليم`,
            timestamp: order.date_due,
            read: false,
            actionUrl: '/orders',
            metadata: { orderId: order.id },
          });
        });
      }

      // Get low stock materials
      const materialsResponse = await window.api.materials.lowStock();
      if (materialsResponse.ok && materialsResponse.data) {
        materialsResponse.data.forEach((material) => {
          newNotifications.push({
            id: `lowstock-${material.id}`,
            type: 'low_stock',
            title: 'مخزون منخفض',
            message: `المادة "${material.name}" وصلت للحد الأدنى`,
            timestamp: now,
            read: false,
            actionUrl: '/materials',
            metadata: { materialId: material.id },
          });
        });
      }

      // Get pending payments
      const paymentsResponse = await window.api.orders.list({
        status: 'delivered',
      });

      if (paymentsResponse.ok && paymentsResponse.data) {
        for (const order of paymentsResponse.data.orders) {
          const paymentStatus = await window.api.orders.paymentStatus(order.id);
          if (paymentStatus.ok && paymentStatus.data && paymentStatus.data.remaining > 0) {
            newNotifications.push({
              id: `payment-${order.id}`,
              type: 'pending_payment',
              title: 'دفعة مستحقة',
              message: `الطلب #${order.order_number} لديه مبلغ متبقي`,
              timestamp: order.date_delivered || now,
              read: false,
              actionUrl: '/finance',
              metadata: { 
                orderId: order.id,
                amount: paymentStatus.data.remaining,
              },
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(newNotifications);

      // Calculate summary
      const unreadCount = newNotifications.filter((n) => !n.read).length;
      const byType = newNotifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setSummary({
        total: newNotifications.length,
        unread: unreadCount,
        byType: {
          new_order: byType.new_order || 0,
          overdue_order: byType.overdue_order || 0,
          low_stock: byType.low_stock || 0,
          pending_payment: byType.pending_payment || 0,
          order_completed: byType.order_completed || 0,
          system: byType.system || 0,
        },
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setSummary((prev) => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
    }));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setSummary((prev) => ({ ...prev, unread: 0 }));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setSummary({
      total: 0,
      unread: 0,
      byType: {
        new_order: 0,
        overdue_order: 0,
        low_stock: 0,
        pending_payment: 0,
        order_completed: 0,
        system: 0,
      },
    });
  }, []);

  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    notifications,
    summary,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}