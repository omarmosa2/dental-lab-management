import { useEffect, useState, useRef } from 'react';
import { Users, Plus, Search, Edit, Trash2, FileDown, Printer, UserCheck, UserX, Filter, X } from 'lucide-react';
import { useWorkerViewModel } from '../renderer/viewmodels/WorkerViewModel';
import formatCurrency from '../utils/currency';
import { useToast } from '../renderer/hooks/useToast';
import { useDebounce } from '../renderer/hooks/useDebounce';
import { usePagination } from '../renderer/hooks/usePagination';
import { useExportProgress } from '../renderer/hooks/useExportProgress';
import { useSelection } from '../renderer/hooks/useSelection';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import { Button } from '../renderer/components/ui/Button';
import { Table } from '../renderer/components/ui/Table';
import { Modal } from '../renderer/components/ui/Modal';
import { Badge } from '../renderer/components/ui/Badge';
import { Pagination } from '../renderer/components/ui/Pagination';
import { TableSkeleton } from '../renderer/components/ui/Skeleton';
import { ExportProgressModal } from '../renderer/components/ui/ProgressBar';
import { ToastContainer } from '../renderer/components/ui/Toast';
import { AnimatedButton } from '../renderer/components/ui/AnimatedButton';
import { BulkActionsToolbar } from '../renderer/components/ui/BulkActionsToolbar';
import { WorkerForm } from '../renderer/components/forms/WorkerForm';
import type { Worker } from '../shared/types/api.types';
import { WorkerStatusLabels } from '../shared/constants/enums';

export default function Workers() {
  const {
    workers,
    totalCount,
    loading,
    error,
    loadWorkers,
    getTotalCount,
    createWorker,
    updateWorker,
    deleteWorker,
    activateWorker,
    deactivateWorker,
  } = useWorkerViewModel();

  const { toasts, removeToast, success, error: showError } = useToast();
  const { exportProgress, isExporting, resetProgress, startExport } = useExportProgress();
  const {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
  } = useSelection<Worker>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

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
        await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
        success('تم تحديث البيانات');
      },
    },
    {
      ...GLOBAL_SHORTCUTS.ESCAPE,
      action: () => {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        else if (isEditModalOpen) setIsEditModalOpen(false);
        else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      },
    },
  ]);

  // Load workers with pagination
  useEffect(() => {
    const loadData = async () => {
      await getTotalCount();
      await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
    };
    loadData();
  }, [currentPage, loadWorkers, getTotalCount]);

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
    const result = await createWorker(data);
    if (result) {
      success('تم إضافة العامل بنجاح');
      setIsCreateModalOpen(false);
      await getTotalCount();
      await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedWorker) return;
    const result = await updateWorker(selectedWorker.id, data);
    if (result) {
      success('تم تحديث بيانات العامل بنجاح');
      setIsEditModalOpen(false);
      setSelectedWorker(null);
      await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorker) return;
    const result = await deleteWorker(selectedWorker.id);
    if (result) {
      success('تم حذف العامل بنجاح');
      setIsDeleteModalOpen(false);
      setSelectedWorker(null);
      await getTotalCount();
      await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const handleToggleStatus = async (worker: Worker) => {
    const result = worker.status === 'active' 
      ? await deactivateWorker(worker.id)
      : await activateWorker(worker.id);
    
    if (result) {
      success(worker.status === 'active' ? 'تم إيقاف العامل' : 'تم تفعيل العامل');
      await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const openEditModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsDeleteModalOpen(true);
  };

  const handleExport = async () => {
    try {
      startExport();
      const response = await window.exportApi.workers();
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
      const currentWorkers = filteredWorkers.map(worker => ({
        'الرقم': worker.id.toString(),
        'الاسم': worker.name,
        'الهاتف': worker.phone,
        'الراتب': formatCurrency(worker.salary),
        'الحالة': worker.status === 'active' ? 'نشط' : 'غير نشط',
      }));

      const columns = [
        { key: 'الرقم', label: 'الرقم', width: 60 },
        { key: 'الاسم', label: 'الاسم', width: 120 },
        { key: 'الهاتف', label: 'الهاتف', width: 100 },
        { key: 'الراتب', label: 'الراتب', width: 100 },
        { key: 'الحالة', label: 'الحالة', width: 80 },
      ];

      const response = await window.printApi.report('تقرير العمال', currentWorkers, columns);
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

  // Filter workers in real-time
  const filteredWorkers = workers.filter(w => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const statusText = WorkerStatusLabels[w.status];
    const hireDate = new Date(w.hire_date * 1000).toLocaleDateString('ar-SA');
    
    return w.name.toLowerCase().includes(searchLower) ||
      w.phone.includes(debouncedSearch) ||
      statusText.toLowerCase().includes(searchLower) ||
      w.salary.toString().includes(debouncedSearch) ||
      hireDate.includes(debouncedSearch);
  });

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        const result = await deleteWorker(id);
        if (result) successCount++;
        else failCount++;
      }

      if (successCount > 0) {
        success(`تم حذف ${successCount} عامل بنجاح`);
        if (failCount > 0) {
          showError(`فشل حذف ${failCount} عامل`);
        }
        setIsBulkDeleteModalOpen(false);
        deselectAll();
        await getTotalCount();
        await loadWorkers({}, currentPage, ITEMS_PER_PAGE);
      } else {
        showError('فشل حذف العمال المحددين');
      }
    } catch (err) {
      showError('حدث خطأ أثناء حذف العمال');
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={isAllSelected(filteredWorkers)}
          onChange={() => {
            if (isAllSelected(filteredWorkers)) {
              deselectAll();
            } else {
              selectAll(filteredWorkers);
            }
          }}
          className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600"
        />
      ),
      width: '50px',
      render: (worker: Worker) => (
        <input
          type="checkbox"
          checked={isSelected(worker.id)}
          onChange={() => toggleSelection(worker.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600"
        />
      ),
    },
    { key: 'id', label: 'الرقم', width: '80px' },
    { key: 'name', label: 'الاسم' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'specialization', label: 'التخصص', render: (w: Worker) => w.specialization || '-' },
    {
      key: 'performance_rating',
      label: 'التقييم',
      render: (w: Worker) => (
        <div className="flex items-center gap-1">
          <span className="font-medium">{w.performance_rating.toFixed(1)}</span>
          <span className="text-warning-500">★</span>
        </div>
      ),
    },
    {
      key: 'salary',
      label: 'الراتب',
      render: (w: Worker) => formatCurrency(w.salary),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (worker: Worker) => (
        <Badge variant={worker.status === 'active' ? 'success' : 'neutral'} size="sm">
          {WorkerStatusLabels[worker.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      width: '200px',
      render: (worker: Worker) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(worker);
            }}
            className={`p-2 rounded-lg transition-colors ${
              worker.status === 'active'
                ? 'hover:bg-warning/10 text-warning'
                : 'hover:bg-success/10 text-success'
            }`}
            title={worker.status === 'active' ? 'إيقاف' : 'تفعيل'}
          >
            {worker.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(worker);
            }}
            className="p-2 rounded-lg text-theme-primary transition-colors hover:bg-theme-surface-hover"
            title="تعديل"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(worker);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in-up">
          <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
            إدارة العمال
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            إدارة بيانات عمال المختبر
          </p>
        </div>
        <div className="flex items-center gap-3 animate-fade-in-up stagger-1">
          <AnimatedButton 
            variant="outline" 
            onClick={handleExport}
            leftIcon={<FileDown className="w-4 h-4" />}
          >
            تصدير Excel
          </AnimatedButton>
          <AnimatedButton 
            variant="outline" 
            onClick={handlePrintReport}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            طباعة
          </AnimatedButton>
          <AnimatedButton 
            variant="primary" 
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إضافة عامل
          </AnimatedButton>
        </div>
      </div>

      <BulkActionsToolbar
        selectedCount={selectedCount}
        totalCount={filteredWorkers.length}
        onSelectAll={() => selectAll(filteredWorkers)}
        onDeselectAll={deselectAll}
        onDelete={() => setIsBulkDeleteModalOpen(true)}
        onExport={handleExport}
      />

      <div className="card hover:shadow-lg transition-all duration-300">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none transition-colors" />
          <input
            type="text"
            ref={searchInputRef}
            placeholder="بحث في جميع الحقول (الاسم، الهاتف، الحالة، الراتب، تاريخ التوظيف...)"
            className="input-base pr-12 pl-12 w-full text-base transition-all duration-200 focus:shadow-md"
            value={searchQuery}
            aria-label="بحث في العمال"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-all duration-200 hover:scale-110"
              title="مسح البحث"
              aria-label="مسح البحث"
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
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
                <span>
                  عرض {filteredWorkers.length} من {workers.length} عامل في الصفحة الحالية
                </span>
              </>
            ) : (
              <span>
                إجمالي العمال: {totalCount} | الصفحة {currentPage} من {totalPages}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} columns={8} />
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              {workers.length === 0 ? 'لا يوجد عمال حالياً' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {workers.length === 0 
                ? 'ابدأ بإضافة أول عامل في النظام'
                : 'جرب كلمة بحث أخرى'
              }
            </p>
            {workers.length === 0 ? (
              <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>إضافة عامل</span>
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
              data={filteredWorkers}
              keyExtractor={(worker) => worker.id}
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
        title="إضافة عامل جديد"
        size="lg"
      >
        <WorkerForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={loading}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedWorker(null);
        }}
        title="تعديل بيانات العامل"
        size="lg"
      >
        {selectedWorker && (
          <WorkerForm
            initialData={selectedWorker}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedWorker(null);
            }}
            isLoading={loading}
          />
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedWorker(null);
        }}
        title="تأكيد الحذف"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedWorker(null);
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
          هل أنت متأكد من حذف العامل <strong>{selectedWorker?.name}</strong>؟
          <br />
          لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="تأكيد الحذف الجماعي"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              isLoading={loading}
            >
              حذف ({selectedCount})
            </Button>
          </>
        }
      >
        <p className="text-neutral-700 dark:text-neutral-300">
          هل أنت متأكد من حذف <strong>{selectedCount}</strong> عامل؟
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