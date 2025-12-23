import { useEffect, useState, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  Plus,
  Eye,
  Trash2,
  FileDown,
  Printer,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  X
} from 'lucide-react';
import { usePaymentViewModel } from '../renderer/viewmodels/PaymentViewModel';
import { useOrderViewModel } from '../renderer/viewmodels/OrderViewModel';
import { useDentistViewModel } from '../renderer/viewmodels/DentistViewModel';
import { useToast } from '../renderer/hooks/useToast';
import { useDebounce } from '../renderer/hooks/useDebounce';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import formatCurrency from '../utils/currency';
import { Select } from '../renderer/components/ui/Select';
import { Button } from '../renderer/components/ui/Button';
import { Modal } from '../renderer/components/ui/Modal';
import { Badge } from '../renderer/components/ui/Badge';
import { Table } from '../renderer/components/ui/Table';
import { ToastContainer } from '../renderer/components/ui/Toast';
import type { Order, Payment } from '../shared/types/api.types';
import { OrderStatusLabels } from '../shared/constants/enums';

interface PaymentWithOrder extends Payment {
  order?: Order;
  dentist_name?: string;
}

export default function Finance() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('month');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDiscount, setPaymentDiscount] = useState('0');
  const [paymentNote, setPaymentNote] = useState('');
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentWithOrder[]>([]);
  const [isOrderIncompleteDialogOpen, setIsOrderIncompleteDialogOpen] = useState(false);
  const [shouldMarkComplete, setShouldMarkComplete] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { payments, createPayment, deletePayment, getOrderPayments, computeRemaining } = usePaymentViewModel();
  const { orders, loadOrders, changeStatus } = useOrderViewModel();
  const { dentists, loadDentists } = useDentistViewModel();
  const { toasts, removeToast, success, error: showError } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.SEARCH,
      action: () => searchInputRef.current?.focus(),
    },
    {
      ...GLOBAL_SHORTCUTS.REFRESH,
      action: () => {
        loadFinancialData();
        success('تم تحديث البيانات');
      },
    },
    {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      action: () => {
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
        else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        else if (isOrderIncompleteDialogOpen) setIsOrderIncompleteDialogOpen(false);
      },
    },
  ]);

  useEffect(() => {
    loadFinancialData();
    loadDentists();
  }, [selectedPeriod]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load financial summary
      const summaryResponse = await window.api.reports.financial();
      if (summaryResponse.ok) {
        setSummary(summaryResponse.data);
      }

      // Load all orders to find unpaid ones
      const ordersResponse = await window.api.orders.list({}, { page: 1, limit: 1000 });
      if (ordersResponse.ok && ordersResponse.data) {
        const allOrders = (ordersResponse.data as any).orders || [];
        
        // Find orders with pending payments
        const unpaid: Order[] = [];
        for (const order of allOrders) {
          if (order.status !== 'cancelled') {
            const remaining = await computeRemaining(order.id);
            if (remaining > 0) {
              unpaid.push({ ...order, remaining } as any);
            }
          }
        }
        setUnpaidOrders(unpaid);
      }

      // Load recent payments
      const paymentsResponse = await window.api.payments.list({});
      if (paymentsResponse.ok && paymentsResponse.data) {
        const allPayments = paymentsResponse.data;
        
        // Enrich payments with order and dentist info
        const enrichedPayments: PaymentWithOrder[] = await Promise.all(
          allPayments.slice(0, 10).map(async (payment) => {
            const orderResponse = await window.api.orders.get(payment.order_id);
            if (orderResponse.ok && orderResponse.data) {
              const order = orderResponse.data;
              const dentist = dentists.find(d => d.id === order.dentist_id);
              return {
                ...payment,
                order,
                dentist_name: dentist?.name || 'غير معروف'
              };
            }
            return payment;
          })
        );
        setRecentPayments(enrichedPayments);
      }

    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات المالية');
      console.error('Error loading financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedOrder) return;

    const amount = parseFloat(paymentAmount);
    const discount = parseFloat(paymentDiscount);

    if (isNaN(amount) || amount <= 0) {
      showError('الرجاء إدخال مبلغ صحيح');
      return;
    }

    // Check if order is not completed
    if (selectedOrder.status !== 'completed' && selectedOrder.status !== 'delivered') {
      setIsOrderIncompleteDialogOpen(true);
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    if (!selectedOrder) return;

    const amount = parseFloat(paymentAmount);
    const discount = parseFloat(paymentDiscount);

    const result = await createPayment({
      order_id: selectedOrder.id,
      amount,
      discount: discount || 0,
      date: Math.floor(Date.now() / 1000),
      note: paymentNote || undefined,
    });

    if (result) {
      // If user chose to mark as complete, update order status
      if (shouldMarkComplete) {
        await changeStatus(selectedOrder.id, 'completed');
      }

      success('تم تسجيل الدفعة بنجاح');
      setIsPaymentModalOpen(false);
      setIsOrderIncompleteDialogOpen(false);
      setSelectedOrder(null);
      setPaymentAmount('');
      setPaymentDiscount('0');
      setPaymentNote('');
      setShouldMarkComplete(false);
      loadFinancialData();
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    const result = await deletePayment(selectedPayment.id);
    if (result) {
      success('تم حذف الدفعة بنجاح');
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
      loadFinancialData();
    }
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setPaymentAmount('');
    setPaymentDiscount('0');
    setPaymentNote('');
    setIsPaymentModalOpen(true);
  };

  const openDeleteModal = (payment: PaymentWithOrder) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };


  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getPaymentStatusBadge = (order: any) => {
    const remaining = order.remaining || 0;
    if (remaining === 0) {
      return <Badge variant="success" size="sm"><CheckCircle size={14} className="ml-1" />مدفوع كاملاً</Badge>;
    } else if (remaining === order.price) {
      return <Badge variant="error" size="sm"><XCircle size={14} className="ml-1" />غير مدفوع</Badge>;
    } else {
      return <Badge variant="warning" size="sm"><Clock size={14} className="ml-1" />دفع جزئي</Badge>;
    }
  };

  // Filter unpaid orders and payments
  const filteredUnpaidOrders = unpaidOrders.filter(order => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const dentist = dentists.find(d => d.id === order.dentist_id);
    const remaining = (order as any).remaining || 0;
    const paymentStatus = remaining === 0 ? 'مدفوع كاملاً' : 
                         remaining === order.price ? 'غير مدفوع' : 'دفع جزئي';
    
    return order.order_number.toLowerCase().includes(searchLower) ||
      (dentist?.name || '').toLowerCase().includes(searchLower) ||
      order.price.toString().includes(debouncedSearch) ||
      remaining.toString().includes(debouncedSearch) ||
      paymentStatus.includes(searchLower);
  });

  const filteredRecentPayments = recentPayments.filter(payment => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const paymentDate = new Date(payment.date * 1000).toLocaleDateString('ar-SA');
    
    return (payment.order?.order_number || '').toLowerCase().includes(searchLower) ||
      (payment.dentist_name || '').toLowerCase().includes(searchLower) ||
      (payment.note || '').toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(debouncedSearch) ||
      payment.discount.toString().includes(debouncedSearch) ||
      paymentDate.includes(debouncedSearch);
  });

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
            المالية
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            متابعة الإيرادات والمصروفات والدفعات
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="all">كل الفترة</option>
            <option value="month">هذا الشهر</option>
            <option value="week">هذا الأسبوع</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="card bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-error-900 dark:text-error-100 mb-1">
                خطأ في تحميل البيانات
              </h4>
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
              <button 
                onClick={loadFinancialData}
                className="mt-2 text-sm text-error-600 dark:text-error-400 hover:underline font-medium"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border-success-200 dark:border-success-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-success-500 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-success-700 dark:text-success-300 font-medium">
                إجمالي الإيرادات
              </p>
              <p className="heading-3 text-success-900 dark:text-success-100">
                {summary ? formatCurrency(summary.totalRevenue) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900/20 dark:to-error-800/20 border-error-200 dark:border-error-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-error-500 shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-error-700 dark:text-error-300 font-medium">
                إجمالي المصروفات
              </p>
              <p className="heading-3 text-error-900 dark:text-error-100">
                {summary ? formatCurrency(summary.totalExpenses) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card border-theme-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-theme-primary">
                صافي الربح
              </p>
              <p className={`heading-3 ${summary && summary.netProfit >= 0 ? 'text-theme-primary' : 'text-error-600'}`}>
                {summary ? formatCurrency(summary.netProfit) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 border-warning-200 dark:border-warning-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-warning-500 shadow-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-warning-700 dark:text-warning-300 font-medium">
                المدفوعات المعلقة
              </p>
              <p className="heading-3 text-warning-900 dark:text-warning-100">
                {summary ? formatCurrency(summary.pendingPayments) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            ref={searchInputRef}
            placeholder="بحث في جميع الحقول (رقم الطلب، الطبيب، المبلغ، التاريخ، الملاحظات، حالة الدفع...)"
            className="input-base pr-12 pl-12 w-full text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
              title="مسح البحث"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>
              عرض {filteredUnpaidOrders.length} من {unpaidOrders.length} طلب غير مدفوع
              {filteredRecentPayments.length !== recentPayments.length && 
                ` و ${filteredRecentPayments.length} من ${recentPayments.length} دفعة`
              }
            </span>
          </div>
        )}
      </div>

      {/* Unpaid Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-4 text-neutral-900 dark:text-white">
            الطلبات غير المدفوعة ({filteredUnpaidOrders.length})
          </h3>
        </div>

        {filteredUnpaidOrders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              جميع الطلبات مدفوعة بالكامل
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">رقم الطلب</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الطبيب</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">السعر الكلي</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">المتبقي</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الحالة</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnpaidOrders.map((order: any) => {
                  const dentist = dentists.find(d => d.id === order.dentist_id);
                  return (
                    <tr key={order.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white font-medium">
                        {order.order_number}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                        {dentist?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white font-semibold">
                        {formatCurrency(order.price)}
                      </td>
                      <td className="py-3 px-4 text-sm text-warning-600 dark:text-warning-400 font-semibold">
                        {formatCurrency(order.remaining)}
                      </td>
                      <td className="py-3 px-4">
                        {getPaymentStatusBadge(order)}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openPaymentModal(order)}
                        >
                          <Plus size={16} />
                          تسجيل دفعة
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-4 text-neutral-900 dark:text-white">
            آخر الدفعات ({filteredRecentPayments.length})
          </h3>
        </div>

        {filteredRecentPayments.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              لا توجد دفعات مسجلة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">التاريخ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">رقم الطلب</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الطبيب</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">المبلغ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الخصم</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الصافي</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">ملاحظات</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                      {formatDate(payment.date)}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white font-medium">
                      {payment.order?.order_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                      {payment.dentist_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-error-600 dark:text-error-400">
                      {payment.discount > 0 ? formatCurrency(payment.discount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-success-600 dark:text-success-400 font-semibold">
                      {formatCurrency(payment.amount - payment.discount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {payment.note || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openDeleteModal(payment)}
                        className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/30 text-error-600 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="تسجيل دفعة جديدة"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">معلومات الطلب</p>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">رقم الطلب:</span> {selectedOrder.order_number}</p>
                <p className="text-sm"><span className="font-semibold">السعر الكلي:</span> {formatCurrency(selectedOrder.price)}</p>
                <p className="text-sm"><span className="font-semibold">المتبقي:</span> <span className="text-warning-600 font-semibold">{formatCurrency((selectedOrder as any).remaining || 0)}</span></p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                المبلغ المدفوع *
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="أدخل المبلغ"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                الخصم (اختياري)
              </label>
              <input
                type="number"
                value={paymentDiscount}
                onChange={(e) => setPaymentDiscount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="ملاحظات إضافية (اختياري)"
                rows={3}
              />
            </div>

            {paymentAmount && (
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  <span className="font-semibold">الصافي المدفوع:</span> {formatCurrency(parseFloat(paymentAmount) - parseFloat(paymentDiscount || '0'))}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="primary" onClick={handleAddPayment} className="flex-1">
                <Plus size={18} />
                تسجيل الدفعة
              </Button>
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Incomplete Dialog */}
      <Modal
        isOpen={isOrderIncompleteDialogOpen}
        onClose={() => {
          setIsOrderIncompleteDialogOpen(false);
          setShouldMarkComplete(false);
        }}
        title="تنبيه: الطلب غير مكتمل"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-900 dark:text-warning-100 mb-1">
                  الطلب في حالة: <Badge variant={selectedOrder.status === 'pending' ? 'warning' : 'primary'} size="sm">
                    {OrderStatusLabels[selectedOrder.status]}
                  </Badge>
                </p>
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  هذا الطلب لم يتم تحديده كمكتمل بعد. هل تريد تسجيل الدفعة على أي حال؟
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shouldMarkComplete}
                  onChange={(e) => setShouldMarkComplete(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  تحديد الطلب كمكتمل تلقائياً عند تسجيل الدفعة
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={processPayment}
                className="flex-1"
              >
                متابعة تسجيل الدفعة
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOrderIncompleteDialogOpen(false);
                  setShouldMarkComplete(false);
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Payment Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأكيد الحذف"
        size="sm"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <p className="text-neutral-700 dark:text-neutral-300">
              هل أنت متأكد من حذف هذه الدفعة؟
            </p>
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <p className="text-sm"><span className="font-semibold">المبلغ:</span> {formatCurrency(selectedPayment.amount)}</p>
              <p className="text-sm"><span className="font-semibold">التاريخ:</span> {formatDate(selectedPayment.date)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDeletePayment} className="flex-1">
                <Trash2 size={18} />
                حذف
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}