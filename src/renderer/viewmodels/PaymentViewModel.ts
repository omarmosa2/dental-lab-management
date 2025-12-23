import { useState, useCallback } from 'react';
import type { Payment, CreatePaymentDto, PaymentFilters } from '../../shared/types/api.types';

export function usePaymentViewModel() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load payments with filters
  const loadPayments = useCallback(async (filters?: PaymentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.payments.list(filters);
      if (response.ok && response.data) {
        setPayments(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.error?.message || 'فشل تحميل الدفعات');
        setPayments([]);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الدفعات');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get payments for specific order
  const getOrderPayments = useCallback(async (orderId: number): Promise<Payment[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.payments.byOrder(orderId);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'فشل تحميل دفعات الطلب');
        return [];
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل دفعات الطلب');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create payment
  const createPayment = useCallback(async (data: CreatePaymentDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.payments.create(data);
      if (response.ok && response.data) {
        setPayments((prev) => [response.data!, ...prev]);
        return true;
      } else {
        setError(response.error?.message || 'فشل إضافة الدفعة');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء إضافة الدفعة');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete payment
  const deletePayment = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.payments.delete(id);
      if (response.ok) {
        setPayments((prev) => prev.filter((p) => p.id !== id));
        return true;
      } else {
        setError(response.error?.message || 'فشل حذف الدفعة');
        return false;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حذف الدفعة');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute remaining amount for order
  const computeRemaining = useCallback(async (orderId: number): Promise<number> => {
    setLoading(true);
    setError(null);
    try {
      const response = await window.api.payments.remaining(orderId);
      if (response.ok && response.data !== undefined) {
        return response.data;
      } else {
        setError(response.error?.message || 'فشل حساب المبلغ المتبقي');
        return 0;
      }
    } catch (err) {
      setError('حدث خطأ أثناء حساب المبلغ المتبقي');
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    payments,
    loading,
    error,
    loadPayments,
    getOrderPayments,
    createPayment,
    deletePayment,
    computeRemaining,
  };
}