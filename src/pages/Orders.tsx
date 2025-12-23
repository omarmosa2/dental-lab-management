import { useEffect, useState, useRef } from 'react';
import { ClipboardList, Plus, Search, Filter, Edit, Trash2, FileDown, Printer, Eye, FileText, X, Users, Calendar, DollarSign } from 'lucide-react';
import { useOrderViewModel } from '../renderer/viewmodels/OrderViewModel';
import { useDentistViewModel } from '../renderer/viewmodels/DentistViewModel';
import { useWorkerViewModel } from '../renderer/viewmodels/WorkerViewModel';
import formatCurrency from '../utils/currency';
import { useToast } from '../renderer/hooks/useToast';
import { useDebounce } from '../renderer/hooks/useDebounce';
import { usePagination } from '../renderer/hooks/usePagination';
import { useExportProgress } from '../renderer/hooks/useExportProgress';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import { Button } from '../renderer/components/ui/Button';
import { Input } from '../renderer/components/ui/Input';
import { Select } from '../renderer/components/ui/Select';
import { Table } from '../renderer/components/ui/Table';
import { Modal } from '../renderer/components/ui/Modal';
import { Badge } from '../renderer/components/ui/Badge';
import { ExportProgressModal } from '../renderer/components/ui/ProgressBar';
import { ToastContainer } from '../renderer/components/ui/Toast';
import { OrderForm } from '../renderer/components/forms/OrderForm';
import type { Order } from '../shared/types/api.types';
import { OrderStatusLabels } from '../shared/constants/enums';

export default function Orders() {
  const {
    orders,
    loading,
    error,
    totalCount,
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    changeStatus,
  } = useOrderViewModel();

  const { dentists, loadDentists } = useDentistViewModel();
  const { workers, loadActiveWorkers } = useWorkerViewModel();
  const { toasts, removeToast, success, error: showError } = useToast();
  const { exportProgress, isExporting, resetProgress, startExport } = useExportProgress();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { currentPage, itemsPerPage, totalPages, goToPage, nextPage, previousPage } = usePagination({
    totalItems: totalCount,
    itemsPerPage: 10,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [orderPayments, setOrderPayments] = useState<any[]>([]);
  const [orderPaymentSummary, setOrderPaymentSummary] = useState<{ total: number; remaining: number }>({ total: 0, remaining: 0 });

  // Load data on mount
  useEffect(() => {
    loadDentists();
    loadActiveWorkers();
  }, [loadDentists, loadActiveWorkers]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.NEW,
      action: () => setIsCreateModalOpen(true),
    },
    {
      ...GLOBAL_SHORTCUTS.SEARCH,
      action: () => searchInputRef.current?.focus(),
    },
    {
      ...GLOBAL_SHORTCUTS.EXPORT,
      action: () => handleExport(),
    },
    {
      ...GLOBAL_SHORTCUTS.PRINT,
      action: () => handlePrintReport(),
    },
    {
      ...GLOBAL_SHORTCUTS.REFRESH,
      action: () => {
        loadOrders({}, currentPage, itemsPerPage);
        success('تم تحديث البيانات');
      },
    },
    {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      action: () => {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        else if (isEditModalOpen) setIsEditModalOpen(false);
        else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
        else if (isViewModalOpen) setIsViewModalOpen(false);
        else if (isStatusModalOpen) setIsStatusModalOpen(false);
      },
    },
  ]);

  // Load orders when pagination changes
  useEffect(() => {
    loadOrders({}, currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, loadOrders]);

  // Handle navigation from search - highlight selected order
  useEffect(() => {
    const selectedId = sessionStorage.getItem('selectedItemId');
    const selectedType = sessionStorage.getItem('selectedItemType');
    
    if (selectedId && selectedType === 'order') {
      // Clear the session storage
      sessionStorage.removeItem('selectedItemId');
      sessionStorage.removeItem('selectedItemType');
      
      // Find and open the order in view modal
      const order = orders.find(o => o.id === parseInt(selectedId));
      if (order) {
        setTimeout(() => {
          openViewModal(order);
        }, 300);
      }
    }
  }, [orders]);

  // Filter orders in real-time
  const filteredOrders = orders.filter(order => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const dentist = dentists.find(d => d.id === order.dentist_id);
    const statusText = OrderStatusLabels[order.status];
    const dateReceived = new Date(order.date_received * 1000).toLocaleDateString('ar-SA');
    const dateDue = new Date(order.date_due * 1000).toLocaleDateString('ar-SA');
    const dateDelivered = order.date_delivered 
      ? new Date(order.date_delivered * 1000).toLocaleDateString('ar-SA')
      : '';
    
    return order.order_number.toLowerCase().includes(searchLower) ||
      (dentist?.name || '').toLowerCase().includes(searchLower) ||
      order.case_type.toLowerCase().includes(searchLower) ||
      order.main_material.toLowerCase().includes(searchLower) ||
      order.finish_type.toLowerCase().includes(searchLower) ||
      order.shade.toLowerCase().includes(searchLower) ||
      statusText.toLowerCase().includes(searchLower) ||
      (order.notes || '').toLowerCase().includes(searchLower) ||
      dateReceived.includes(debouncedSearch) ||
      dateDue.includes(debouncedSearch) ||
      dateDelivered.includes(debouncedSearch) ||
      order.price.toString().includes(debouncedSearch);
  });

  // Show error toast
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const handleCreate = async (data: any) => {
    const result = await createOrder(data);
    if (result) {
      success('تم إضافة الطلب بنجاح');
      setIsCreateModalOpen(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedOrder) return;
    const result = await updateOrder(selectedOrder.id, data);
    if (result) {
      success('تم تحديث بيانات الطلب بنجاح');
      setIsEditModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    const result = await deleteOrder(selectedOrder.id);
    if (result) {
      success('تم حذف الطلب بنجاح');
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    const result = await changeStatus(selectedOrder.id, newStatus);
    if (result) {
      success('تم تغيير حالة الطلب بنجاح');
      setIsStatusModalOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = async (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
    
    // Load payment information
    try {
      const paymentsResponse = await window.api.payments.list({ order_id: order.id });
      if (paymentsResponse.ok && paymentsResponse.data) {
        const payments = paymentsResponse.data;
        setOrderPayments(payments);
        
        // Calculate payment summary
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount - p.discount), 0);
        const remaining = order.price - totalPaid;
        setOrderPaymentSummary({ total: totalPaid, remaining });
      }
    } catch (err) {
      console.error('Error loading payments:', err);
      setOrderPayments([]);
      setOrderPaymentSummary({ total: 0, remaining: order.price });
    }
  };

  const handleExport = async () => {
    try {
      startExport();
      const response = await window.exportApi.orders({});
      if (response.ok && response.data) {
        success('تم تصدير البيانات بنجاح');
        setTimeout(resetProgress, 2000);
      } else {
        showError(response.error?.message || 'فشل تصدير البيانات');
        resetProgress();
      }
    } catch (err) {
      showError('حدث خطأ أثناء تصدير البيانات');
      resetProgress();
    }
  };

  const handlePrintReport = async () => {
    try {
      startExport();
      // Get current filtered orders
      const currentOrders = filteredOrders.map(order => {
        const dentist = dentists.find(d => d.id === order.dentist_id);
        return {
          'رقم الطلب': order.order_number,
          'الطبيب': dentist?.name || '-',
          'نوع الحالة': order.case_type,
          'المادة': order.main_material,
          'الحالة': OrderStatusLabels[order.status],
          'تاريخ التسليم': new Date(order.date_due * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          'السعر': formatCurrency(order.price),
        };
      });

      const columns = [
        { key: 'رقم الطلب', label: 'رقم الطلب', width: 80 },
        { key: 'الطبيب', label: 'الطبيب', width: 120 },
        { key: 'نوع الحالة', label: 'نوع الحالة', width: 100 },
        { key: 'المادة', label: 'المادة', width: 80 },
        { key: 'الحالة', label: 'الحالة', width: 80 },
        { key: 'تاريخ التسليم', label: 'تاريخ التسليم', width: 100 },
        { key: 'السعر', label: 'السعر', width: 80 },
      ];

      const response = await window.printApi.report('تقرير الطلبات', currentOrders, columns);
      if (response.ok) {
        success('تم طباعة التقرير بنجاح');
        setTimeout(resetProgress, 2000);
      } else {
        showError(response.error?.message || 'فشل طباعة التقرير');
        resetProgress();
      }
    } catch (err) {
      showError('حدث خطأ أثناء طباعة التقرير');
      resetProgress();
    }
  };

  const handlePrintOrder = async (orderId: number) => {
    try {
      const response = await window.printApi.order(orderId);
      if (response.ok) {
        success('تم طباعة الطلب بنجاح');
      } else {
        showError(response.error?.message || 'فشل طباعة الطلب');
      }
    } catch (err) {
      showError('حدث خطأ أثناء طباعة الطلب');
    }
  };

  const handlePrintInvoice = async (orderId: number) => {
    try {
      const response = await window.printApi.invoice(orderId);
      if (response.ok) {
        success('تم طباعة الفاتورة بنجاح');
      } else {
        showError(response.error?.message || 'فشل طباعة الفاتورة');
      }
    } catch (err) {
      showError('حدث خطأ أثناء طباعة الفاتورة');
    }
  };

  const getStatusBadgeVariant = (status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const columns = [
    { key: 'order_number', label: 'رقم الطلب', width: '120px' },
    {
      key: 'dentist',
      label: 'الطبيب',
      render: (order: Order) => {
        const dentist = dentists.find(d => d.id === order.dentist_id);
        return dentist?.name || '-';
      },
    },
    { key: 'case_type', label: 'نوع الحالة' },
    { key: 'main_material', label: 'المادة' },
    {
      key: 'urgency',
      label: 'الأولوية',
      render: (order: Order) => {
        const urgencyColors: Record<string, 'warning' | 'error' | 'neutral'> = {
          'urgent': 'warning',
          'emergency': 'error',
          'normal': 'neutral',
        };
        const urgencyLabels: Record<string, string> = {
          'urgent': 'مستعجل',
          'emergency': 'طارئ',
          'normal': 'عادي',
        };
        return (
          <Badge variant={urgencyColors[order.urgency_level]} size="sm">
            {urgencyLabels[order.urgency_level]}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (order: Order) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openStatusModal(order);
          }}
          className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          title="انقر لتغيير الحالة"
        >
          <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
            {OrderStatusLabels[order.status]}
          </Badge>
        </button>
      ),
    },
    {
      key: 'date_due',
      label: 'تاريخ التسليم',
      render: (order: Order) => new Date(order.date_due * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
    },
    { key: 'price', label: 'السعر', render: (o: Order) => formatCurrency(o.price) },
    {
      key: 'actions',
      label: 'الإجراءات',
      width: '180px',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openViewModal(order);
            }}
            className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"
            title="عرض"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(order);
            }}
            className="p-2 rounded-lg text-theme-primary transition-colors hover:bg-theme-surface-hover"
            title="تعديل"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintOrder(order.id);
            }}
            className="p-2 rounded-lg text-theme-primary transition-colors hover:bg-theme-surface-hover"
            title="طباعة الطلب"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintInvoice(order.id);
            }}
            className="p-2 rounded-lg text-theme-primary transition-colors hover:bg-theme-surface-hover"
            title="طباعة الفاتورة"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(order);
            }}
            className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
            title="حذف"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
            إدارة الطلبات
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            إدارة طلبات المختبر وتتبع حالتها
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-base btn-outline" onClick={handleExport}>
            <FileDown className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
          <button className="btn-base btn-outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
          <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>طلب جديد</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="بحث في جميع الحقول (رقم الطلب، الطبيب، الحالة، المادة، التاريخ، السعر، الملاحظات...)"
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

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-6 flex items-center gap-2 text-sm text-neutral-600">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span>
              عرض {filteredOrders.length} من {orders.length} طلب
            </span>
          </div>
        )}

        {/* Table */}
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)' }} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              {orders.length === 0 ? 'لا توجد طلبات حالياً' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {orders.length === 0 
                ? 'ابدأ بإضافة أول طلب في النظام'
                : 'جرب كلمة بحث أخرى'
              }
            </p>
            {orders.length === 0 ? (
              <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>طلب جديد</span>
              </button>
            ) : (
              <button className="btn-base btn-outline" onClick={() => setSearchQuery('')}>
                <X size={16} />
                مسح البحث
              </button>
            )}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              لا توجد طلبات حالياً
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              ابدأ بإضافة أول طلب في النظام
            </p>
            <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>طلب جديد</span>
            </button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredOrders}
              keyExtractor={(order) => order.id}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  عرض {filteredOrders.length} من {totalCount} طلب
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={previousPage}
                    disabled={currentPage === 1}
                    className="btn-base btn-outline btn-sm"
                  >
                    السابق
                  </button>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    صفحة {currentPage} من {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="btn-base btn-outline btn-sm"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="طلب جديد"
        size="xl"
      >
        <OrderForm
          dentists={dentists}
          workers={workers}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={loading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrder(null);
        }}
        title="تعديل الطلب"
        size="xl"
      >
        {selectedOrder && (
          <OrderForm
            initialData={selectedOrder}
            dentists={dentists}
            workers={workers}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedOrder(null);
            }}
            isLoading={loading}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedOrder(null);
        }}
        title="تفاصيل الطلب"
        size="xl"
      >
        {selectedOrder && (() => {
          const dentist = dentists.find(d => d.id === selectedOrder.dentist_id);
          const worker = workers.find(w => w.id === selectedOrder.assigned_worker_id);
          const toothNumbersArray = typeof selectedOrder.tooth_numbers === 'string' 
            ? JSON.parse(selectedOrder.tooth_numbers) 
            : selectedOrder.tooth_numbers;
          
          return (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-6 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-900 dark:text-primary-100 mb-2">
                      {selectedOrder.order_number}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(selectedOrder.status)} size="md">
                        {OrderStatusLabels[selectedOrder.status]}
                      </Badge>
                      {selectedOrder.urgency_level !== 'normal' && (
                        <Badge 
                          variant={selectedOrder.urgency_level === 'emergency' ? 'error' : 'warning'} 
                          size="sm"
                        >
                          {selectedOrder.urgency_level === 'urgent' ? 'مستعجل' : 'طارئ'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-primary-700 dark:text-primary-300">السعر الإجمالي</p>
                    <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">
                      {formatCurrency(selectedOrder.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dentist Information */}
              <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  معلومات الطبيب
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">اسم الطبيب</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{dentist?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">رقم الهاتف</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{dentist?.phone || '-'}</p>
                  </div>
                  {dentist?.clinic_name && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">العيادة</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{dentist.clinic_name}</p>
                    </div>
                  )}
                  {dentist?.specialization && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">التخصص</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{dentist.specialization}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-success-600 dark:text-success-400" />
                  </div>
                  تفاصيل الطلب
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">نوع الحالة</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.case_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">أرقام الأسنان</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {Array.isArray(toothNumbersArray) ? toothNumbersArray.join(', ') : toothNumbersArray}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">المادة الأساسية</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.main_material}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">نوع التشطيب</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.finish_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">اللون (Shade)</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.shade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">الكمية</p>
                    <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.quantity}</p>
                  </div>
                  {selectedOrder.warranty_period > 0 && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">فترة الضمان</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.warranty_period} يوم</p>
                    </div>
                  )}
                  {selectedOrder.revision_count > 0 && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">عدد المراجعات</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedOrder.revision_count}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                  </div>
                  التواريخ
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">تاريخ الاستلام</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {new Date(selectedOrder.date_received * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">تاريخ التسليم المتوقع</p>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {new Date(selectedOrder.date_due * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </p>
                  </div>
                  {selectedOrder.try_in_date && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">تاريخ التجربة</p>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {new Date(selectedOrder.try_in_date * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {selectedOrder.date_delivered && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">تاريخ التسليم الفعلي</p>
                      <p className="font-medium text-success-600 dark:text-success-400">
                        {new Date(selectedOrder.date_delivered * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Information */}
              {worker && (
                <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-info-100 dark:bg-info-900/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-info-600 dark:text-info-400" />
                    </div>
                    العامل المكلف
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">اسم العامل</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{worker.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">رقم الهاتف</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{worker.phone}</p>
                    </div>
                    {worker.specialization && (
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">التخصص</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{worker.specialization}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">تقييم الأداء</p>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {worker.performance_rating.toFixed(1)}
                        </span>
                        <span className="text-warning-500">★</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-success-600 dark:text-success-400" />
                  </div>
                  المعلومات المالية
                </h4>
                
                {/* Payment Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">السعر الكلي</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(selectedOrder.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">المدفوع</p>
                    <p className="text-xl font-bold text-success-600 dark:text-success-400">
                      {formatCurrency(orderPaymentSummary.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">المتبقي</p>
                    <p className={`text-xl font-bold ${
                      orderPaymentSummary.remaining > 0 
                        ? 'text-warning-600 dark:text-warning-400' 
                        : 'text-success-600 dark:text-success-400'
                    }`}>
                      {formatCurrency(orderPaymentSummary.remaining)}
                    </p>
                  </div>
                </div>

                {/* Payment History */}
                {orderPayments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      سجل الدفعات ({orderPayments.length})
                    </p>
                    <div className="space-y-2">
                      {orderPayments.map((payment: any) => (
                        <div 
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                              {new Date(payment.date * 1000).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </p>
                            {payment.note && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                {payment.note}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-success-600 dark:text-success-400">
                              {formatCurrency(payment.amount)}
                            </p>
                            {payment.discount > 0 && (
                              <p className="text-xs text-error-600 dark:text-error-400">
                                خصم: {formatCurrency(payment.discount)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {orderPayments.length === 0 && (
                  <div className="text-center py-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      لم يتم تسجيل أي دفعة لهذا الطلب بعد
                    </p>
                  </div>
                )}
              </div>

              {/* Notes and Remake Reason */}
              {(selectedOrder.notes || selectedOrder.remake_reason) && (
                <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    ملاحظات إضافية
                  </h4>
                  {selectedOrder.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">ملاحظات</p>
                      <p className="text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}
                  {selectedOrder.remake_reason && (
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">سبب الإعادة</p>
                      <p className="text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-3 rounded-lg">
                        {selectedOrder.remake_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Button
                  variant="outline"
                  onClick={() => openEditModal(selectedOrder)}
                  className="flex-1"
                >
                  <Edit size={18} />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openStatusModal(selectedOrder)}
                  className="flex-1"
                >
                  تغيير الحالة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedOrder(null);
          setNewStatus('');
        }}
        title="تغيير حالة الطلب"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">معلومات الطلب</p>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">رقم الطلب:</span> {selectedOrder.order_number}</p>
                <p className="text-sm">
                  <span className="font-semibold">الحالة الحالية:</span>{' '}
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)} size="sm">
                    {OrderStatusLabels[selectedOrder.status]}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                الحالة الجديدة *
              </label>
              <Select
                label=""
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={[
                  { value: 'pending', label: 'قيد الانتظار' },
                  { value: 'in_progress', label: 'قيد التنفيذ' },
                  { value: 'completed', label: 'مكتمل' },
                  { value: 'delivered', label: 'تم التسليم' },
                  { value: 'cancelled', label: 'ملغي' },
                ]}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={handleChangeStatus}
                isLoading={loading}
                disabled={!newStatus || newStatus === selectedOrder.status}
                className="flex-1"
              >
                تغيير الحالة
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedOrder(null);
                  setNewStatus('');
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedOrder(null);
        }}
        title="تأكيد الحذف"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedOrder(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={loading}
            >
              حذف
            </Button>
          </>
        }
      >
        <p className="text-neutral-700 dark:text-neutral-300">
          هل أنت متأكد من حذف الطلب <strong>{selectedOrder?.order_number}</strong>؟
          <br />
          لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={isExporting}
        progress={exportProgress.progress}
        message={exportProgress.message}
        onClose={resetProgress}
      />
    </div>
  );
}