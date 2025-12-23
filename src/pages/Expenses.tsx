import { useEffect, useState, useRef } from 'react';
import { DollarSign, Plus, Search, Trash2, FileDown, Printer, Filter, X } from 'lucide-react';
import { useExpenseViewModel } from '../renderer/viewmodels/ExpenseViewModel';
import formatCurrency from '../utils/currency';
import { useToast } from '../renderer/hooks/useToast';
import { useDebounce } from '../renderer/hooks/useDebounce';
import { usePagination } from '../renderer/hooks/usePagination';
import { useExportProgress } from '../renderer/hooks/useExportProgress';
import { useSelection } from '../renderer/hooks/useSelection';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import { Button } from '../renderer/components/ui/Button';
import { Select } from '../renderer/components/ui/Select';
import { Table } from '../renderer/components/ui/Table';
import { Modal } from '../renderer/components/ui/Modal';
import { Badge } from '../renderer/components/ui/Badge';
import { Pagination } from '../renderer/components/ui/Pagination';
import { TableSkeleton } from '../renderer/components/ui/Skeleton';
import { ExportProgressModal } from '../renderer/components/ui/ProgressBar';
import { ToastContainer } from '../renderer/components/ui/Toast';
import { AnimatedButton } from '../renderer/components/ui/AnimatedButton';
import { BulkActionsToolbar } from '../renderer/components/ui/BulkActionsToolbar';
import { ExpenseForm } from '../renderer/components/forms/ExpenseForm';
import type { Expense } from '../shared/types/api.types';
import { ExpenseCategories } from '../shared/constants/enums';

export default function Expenses() {
  const {
    expenses,
    totalCount,
    loading,
    error,
    loadExpenses,
    getTotalCount,
    createExpense,
    deleteExpense,
    getTotalByPeriod,
  } = useExpenseViewModel();

  const { toasts, removeToast, success, error: showError } = useToast();
  const { exportProgress, isExporting, resetProgress, startExport } = useExportProgress();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const {
    currentPage,
    totalPages,
    goToPage,
  } = usePagination({
    totalItems: totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
  });

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
      action: async () => {
        await getTotalCount();
        await loadExpenses({}, currentPage, ITEMS_PER_PAGE);
        loadMonthlyTotal();
        success('تم تحديث البيانات');
      },
    },
    {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      action: () => {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      },
    },
  ]);

  // Load expenses with pagination
  useEffect(() => {
    const loadData = async () => {
      await getTotalCount();
      await loadExpenses({}, currentPage, ITEMS_PER_PAGE);
      loadMonthlyTotal();
    };
    loadData();
  }, [currentPage, loadExpenses, getTotalCount]);

  const loadMonthlyTotal = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const total = await getTotalByPeriod(
      Math.floor(startOfMonth.getTime() / 1000),
      Math.floor(endOfMonth.getTime() / 1000)
    );
    setMonthlyTotal(total);
  };

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch) {
      goToPage(1);
    }
  }, [debouncedSearch, goToPage]);

  const handleCreate = async (data: any) => {
    const result = await createExpense(data);
    if (result) {
      success('تم إضافة المصروف بنجاح');
      setIsCreateModalOpen(false);
      await getTotalCount();
      await loadExpenses({}, currentPage, ITEMS_PER_PAGE);
      loadMonthlyTotal();
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    const result = await deleteExpense(selectedExpense.id);
    if (result) {
      success('تم حذف المصروف بنجاح');
      setIsDeleteModalOpen(false);
      setSelectedExpense(null);
      await getTotalCount();
      await loadExpenses({}, currentPage, ITEMS_PER_PAGE);
      loadMonthlyTotal();
    }
  };

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  const handleExport = async () => {
    try {
      startExport();
      const response = await window.exportApi.expenses({});
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
      const currentExpenses = filteredExpenses.map(expense => ({
        'التاريخ': new Date(expense.date * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        'الفئة': expense.category,
        'الوصف': expense.description,
        'المبلغ': formatCurrency(expense.amount),
      }));

      const columns = [
        { key: 'التاريخ', label: 'التاريخ', width: 100 },
        { key: 'الفئة', label: 'الفئة', width: 100 },
        { key: 'الوصف', label: 'الوصف', width: 200 },
        { key: 'المبلغ', label: 'المبلغ', width: 100 },
      ];

      const response = await window.printApi.report('تقرير المصروفات', currentExpenses, columns);
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

  // Filter expenses in real-time
  const filteredExpenses = expenses.filter(e => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const expenseDate = new Date(e.date * 1000).toLocaleDateString('ar-SA');
    
    return e.description.toLowerCase().includes(searchLower) ||
      e.category.toLowerCase().includes(searchLower) ||
      e.amount.toString().includes(debouncedSearch) ||
      expenseDate.includes(debouncedSearch);
  });

  const columns = [
    {
      key: 'date',
      label: 'التاريخ',
      width: '120px',
      render: (e: Expense) => new Date(e.date * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
    },
    { key: 'description', label: 'الوصف' },
    {
      key: 'category',
      label: 'الفئة',
      render: (e: Expense) => (
        <Badge variant="neutral" size="sm">{e.category}</Badge>
      ),
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (e: Expense) => formatCurrency(e.amount),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      width: '100px',
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(expense);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
            مصروفات المختبر
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            إدارة وتتبع مصروفات المختبر
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-base btn-outline" onClick={handleExport}>
            <FileDown className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
          <button className="btn-base btn-outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
          <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>إضافة مصروف</span>
          </button>
        </div>
      </div>

      <div className="card border-theme-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-theme-primary mb-1">
              إجمالي مصروفات الشهر الحالي
            </p>
            <p className="heading-2 text-theme-primary">
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
          <div className="p-3 rounded-lg text-theme-primary" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}>
            <DollarSign className="w-8 h-8" style={{ opacity: 10 }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            ref={searchInputRef}
            placeholder="بحث في جميع الحقول (التاريخ، الفئة، الوصف، المبلغ...)"
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            {searchQuery ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span>
                  عرض {filteredExpenses.length} من {expenses.length} مصروف في الصفحة الحالية
                </span>
              </>
            ) : (
              <span>
                إجمالي المصروفات: {totalCount} | الصفحة {currentPage} من {totalPages}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} columns={5} />
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              {expenses.length === 0 ? 'لا توجد مصروفات حالياً' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {expenses.length === 0 
                ? 'ابدأ بإضافة أول مصروف في النظام'
                : 'جرب كلمة بحث أخرى'
              }
            </p>
            {expenses.length === 0 ? (
              <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>إضافة مصروف</span>
              </button>
            ) : (
              <button className="btn-base btn-outline" onClick={() => setSearchQuery('')}>
                <X size={16} />
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredExpenses}
              keyExtractor={(expense) => expense.id}
            />
            
            {/* Pagination */}
            {!searchQuery && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة مصروف جديد"
        size="lg"
      >
        <ExpenseForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={loading}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedExpense(null);
        }}
        title="تأكيد الحذف"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedExpense(null);
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
          هل أنت متأكد من حذف المصروف <strong>{selectedExpense?.description}</strong>؟
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