import { useEffect, useState, useRef } from 'react';
import { Users, Plus, Search, Filter, Edit, Trash2, Phone, FileDown, Printer, X, CheckSquare, Square } from 'lucide-react';
import { useDentistViewModel } from '../renderer/viewmodels/DentistViewModel';
import formatCurrency from '../utils/currency';
import { useToast } from '../renderer/hooks/useToast';
import { useDebounce } from '../renderer/hooks/useDebounce';
import { usePagination } from '../renderer/hooks/usePagination';
import { useExportProgress } from '../renderer/hooks/useExportProgress';
import { useSelection } from '../renderer/hooks/useSelection';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import { Button } from '../renderer/components/ui/Button';
import { Input } from '../renderer/components/ui/Input';
import { Table } from '../renderer/components/ui/Table';
import { Modal } from '../renderer/components/ui/Modal';
import { Badge } from '../renderer/components/ui/Badge';
import { Pagination } from '../renderer/components/ui/Pagination';
import { TableSkeleton } from '../renderer/components/ui/Skeleton';
import { ExportProgressModal } from '../renderer/components/ui/ProgressBar';
import { ToastContainer } from '../renderer/components/ui/Toast';
import { DentistForm } from '../renderer/components/forms/DentistForm';
import { AnimatedButton } from '../renderer/components/ui/AnimatedButton';
import { BulkActionsToolbar } from '../renderer/components/ui/BulkActionsToolbar';
import type { Dentist } from '../shared/types/api.types';

export default function Doctors() {
  const {
    dentists,
    totalCount,
    loading,
    error,
    loadDentists,
    getTotalCount,
    createDentist,
    updateDentist,
    deleteDentist,
    searchDentists,
    bulkDeleteDentists,
  } = useDentistViewModel();

  const { toasts, removeToast, success, error: showError } = useToast();
  const { exportProgress, isExporting, resetProgress, startExport } = useExportProgress();
  const {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedItems,
    isAllSelected,
    isSomeSelected,
  } = useSelection<Dentist>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);

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

  // Load dentists with pagination
  useEffect(() => {
    const loadData = async () => {
      await getTotalCount();
      await loadDentists({}, currentPage, ITEMS_PER_PAGE);
    };
    loadData();
  }, [currentPage, loadDentists, getTotalCount]);

  // Handle navigation from search - highlight selected dentist
  useEffect(() => {
    const selectedId = sessionStorage.getItem('selectedItemId');
    const selectedType = sessionStorage.getItem('selectedItemType');
    
    if (selectedId && selectedType === 'dentist') {
      // Clear the session storage
      sessionStorage.removeItem('selectedItemId');
      sessionStorage.removeItem('selectedItemType');
      
      // Find and open the dentist in edit modal
      const dentist = dentists.find(d => d.id === parseInt(selectedId));
      if (dentist) {
        setTimeout(() => {
          openEditModal(dentist);
        }, 300);
      }
    }
  }, [dentists]);

  // Filter dentists in real-time (client-side filtering on current page)
  const filteredDentists = dentists.filter(dentist => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const genderText = dentist.gender === 'male' ? 'ذكر' : 'أنثى';
    
    return dentist.name.toLowerCase().includes(searchLower) ||
      dentist.phone.includes(debouncedSearch) ||
      dentist.residence.toLowerCase().includes(searchLower) ||
      dentist.case_types.toLowerCase().includes(searchLower) ||
      genderText.includes(searchLower) ||
      (dentist.notes || '').toLowerCase().includes(searchLower);
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
        await loadDentists({}, currentPage, ITEMS_PER_PAGE);
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

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch) {
      goToPage(1);
    }
  }, [debouncedSearch, goToPage]);

  // Show error toast
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const handleCreate = async (data: any) => {
    const result = await createDentist(data);
    if (result) {
      success('تم إضافة الطبيب بنجاح');
      setIsCreateModalOpen(false);
      // Reload to update count and current page
      await getTotalCount();
      await loadDentists({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedDentist) return;
    const result = await updateDentist(selectedDentist.id, data);
    if (result) {
      success('تم تحديث بيانات الطبيب بنجاح');
      setIsEditModalOpen(false);
      setSelectedDentist(null);
      // Reload current page
      await loadDentists({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const handleDelete = async () => {
    if (!selectedDentist) return;
    const result = await deleteDentist(selectedDentist.id);
    if (result) {
      success('تم حذف الطبيب بنجاح');
      setIsDeleteModalOpen(false);
      setSelectedDentist(null);
      // Reload and update count
      await getTotalCount();
      await loadDentists({}, currentPage, ITEMS_PER_PAGE);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const result = await bulkDeleteDentists(ids);
    if (result.success > 0) {
      success(`تم حذف ${result.success} طبيب بنجاح`);
      if (result.failed > 0) {
        showError(`فشل حذف ${result.failed} طبيب`);
      }
      setIsBulkDeleteModalOpen(false);
      deselectAll();
      // Reload and update count
      await getTotalCount();
      await loadDentists({}, currentPage, ITEMS_PER_PAGE);
    } else {
      showError('فشل حذف الأطباء المحددين');
    }
  };

  const handleToggleAll = () => {
    if (isAllSelected(filteredDentists)) {
      deselectAll();
    } else {
      selectAll(filteredDentists);
    }
  };

  const openEditModal = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    setIsDeleteModalOpen(true);
  };

  const handleWhatsApp = async (phone: string) => {
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Remove leading zeros
    cleanPhone = cleanPhone.replace(/^0+/, '');
    
    // If starts with 963, keep it; otherwise add 963
    if (!cleanPhone.startsWith('963')) {
      cleanPhone = '963' + cleanPhone;
    }
    
    // Open WhatsApp in external browser
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    await window.utilApi.openExternal(whatsappUrl);
  };

  const handleExport = async () => {
    try {
      startExport();
      const response = await window.exportApi.dentists();
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
      const currentDentists = filteredDentists.map(dentist => ({
        'الرقم': dentist.id.toString(),
        'الاسم': dentist.name,
        'العيادة': dentist.clinic_name || '-',
        'الهاتف': dentist.phone,
        'التخصص': dentist.specialization || '-',
        'التكلفة': formatCurrency(dentist.cost),
      }));

      const columns = [
        { key: 'الرقم', label: 'الرقم', width: 60 },
        { key: 'الاسم', label: 'الاسم', width: 120 },
        { key: 'العيادة', label: 'العيادة', width: 120 },
        { key: 'الهاتف', label: 'الهاتف', width: 100 },
        { key: 'التخصص', label: 'التخصص', width: 100 },
        { key: 'التكلفة', label: 'التكلفة', width: 80 },
      ];

      const response = await window.printApi.report('تقرير الأطباء', currentDentists, columns);
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

  const columns = [
    {
      key: 'select',
      label: (
        <button
          onClick={handleToggleAll}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
          title={isAllSelected(filteredDentists) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
        >
          {isAllSelected(filteredDentists) ? (
            <CheckSquare size={20} className="text-theme-primary" />
          ) : isSomeSelected(filteredDentists) ? (
            <CheckSquare size={20} className="text-theme-primary opacity-50" />
          ) : (
            <Square size={20} className="text-neutral-400" />
          )}
        </button>
      ),
      width: '50px',
      render: (dentist: Dentist) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelection(dentist.id);
          }}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
        >
          {isSelected(dentist.id) ? (
            <CheckSquare size={20} className="text-primary" />
          ) : (
            <Square size={20} className="text-neutral-400" />
          )}
        </button>
      ),
    },
    { key: 'id', label: 'الرقم', width: '80px' },
    { key: 'name', label: 'الاسم' },
    { key: 'clinic_name', label: 'العيادة', render: (d: Dentist) => d.clinic_name || '-' },
    {
      key: 'phone',
      label: 'الهاتف',
      render: (dentist: Dentist) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWhatsApp(dentist.phone);
          }}
          className="flex items-center gap-2 text-success hover:underline"
        >
          <Phone size={16} />
          {dentist.phone}
        </button>
      ),
    },
    { key: 'specialization', label: 'التخصص', render: (d: Dentist) => d.specialization || '-' },
    { 
      key: 'payment_terms', 
      label: 'شروط الدفع',
      render: (d: Dentist) => {
        const terms: Record<string, string> = {
          'immediate': 'فوري',
          '7_days': '7 أيام',
          '15_days': '15 يوم',
          '30_days': '30 يوم',
        };
        return terms[d.payment_terms] || 'فوري';
      }
    },
    { key: 'cost', label: 'التكلفة', render: (d: Dentist) => formatCurrency(d.cost) },
    {
      key: 'actions',
      label: 'الإجراءات',
      width: '150px',
      render: (dentist: Dentist) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(dentist);
            }}
            className="p-2 rounded-lg text-theme-primary transition-colors hover:bg-theme-surface-hover"
            title="تعديل"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(dentist);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-fade-in-up">
          <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
            إدارة الأطباء
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            إدارة بيانات الأطباء والعيادات
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
            إضافة طبيب
          </AnimatedButton>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedCount}
        totalCount={filteredDentists.length}
        onSelectAll={() => selectAll(filteredDentists)}
        onDeselectAll={deselectAll}
        onDelete={() => setIsBulkDeleteModalOpen(true)}
        onExport={handleExport}
      />

      {/* Search */}
      <div className="card hover:shadow-lg transition-all duration-300">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="بحث في جميع الحقول (الاسم، الهاتف، الجنس، السكن، نوع الحالة، الملاحظات...)"
            className="input-base pr-12 pl-12 w-full text-base transition-all duration-200 focus:shadow-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="بحث في الأطباء"
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
                  عرض {filteredDentists.length} من {dentists.length} طبيب في الصفحة الحالية
                </span>
              </>
            ) : (
              <span>
                إجمالي الأطباء: {totalCount} | الصفحة {currentPage} من {totalPages}
              </span>
            )}
          </div>
        </div>

        {/* Table or Empty State */}
        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} columns={8} />
        ) : filteredDentists.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              {dentists.length === 0 ? 'لا توجد بيانات حالياً' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {dentists.length === 0 
                ? 'ابدأ بإضافة أول طبيب في النظام'
                : 'جرب كلمة بحث أخرى'
              }
            </p>
            {dentists.length === 0 ? (
              <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>إضافة طبيب</span>
              </button>
            ) : (
              <button className="btn-base btn-outline" onClick={() => setSearchQuery('')}>
                <X size={16} />
                مسح البحث
              </button>
            )}
          </div>
        ) : dentists.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              لا توجد بيانات حالياً
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              ابدأ بإضافة أول طبيب في النظام
            </p>
            <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>إضافة طبيب</span>
            </button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredDentists}
              keyExtractor={(dentist) => dentist.id}
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة طبيب جديد"
        size="lg"
      >
        <DentistForm
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
          setSelectedDentist(null);
        }}
        title="تعديل بيانات الطبيب"
        size="lg"
      >
        {selectedDentist && (
          <DentistForm
            initialData={selectedDentist}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedDentist(null);
            }}
            isLoading={loading}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDentist(null);
        }}
        title="تأكيد الحذف"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedDentist(null);
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
          هل أنت متأكد من حذف الطبيب <strong>{selectedDentist?.name}</strong>؟
          <br />
          لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
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
          هل أنت متأكد من حذف <strong>{selectedCount}</strong> طبيب؟
          <br />
          لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>

      {/* Toast Container */}
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