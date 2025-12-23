import { useEffect, useState, useRef } from 'react';
import { Package, Plus, Search, Edit, Trash2, FileDown, Printer, AlertCircle, Filter, X } from 'lucide-react';
import { useMaterialViewModel } from '../renderer/viewmodels/MaterialViewModel';
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
import { MaterialForm } from '../renderer/components/forms/MaterialForm';
import type { Material } from '../shared/types/api.types';

export default function Materials() {
  const {
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
  } = useMaterialViewModel();

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
  } = useSelection<Material>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

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
        await loadMaterials({}, currentPage, ITEMS_PER_PAGE);
        await loadLowStockMaterials();
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

  // Load materials with pagination
  useEffect(() => {
    const loadData = async () => {
      await getTotalCount();
      await loadMaterials({}, currentPage, ITEMS_PER_PAGE);
      await loadLowStockMaterials();
    };
    loadData();
  }, [currentPage, loadMaterials, getTotalCount]);

  const loadLowStockMaterials = async () => {
    try {
      const lowStock = await getLowStock();
      setLowStockMaterials(lowStock);
    } catch (err) {
      // Silently handle - low stock is not critical
      console.warn('Failed to load low stock materials:', err);
      setLowStockMaterials([]);
    }
  };

  // Show error toast (only for critical errors)
  useEffect(() => {
    if (error && !error.includes('منخفضة المخزون')) {
      showError(error);
    }
  }, [error, showError]);

  // Handle navigation from search - highlight selected material
  useEffect(() => {
    const selectedId = sessionStorage.getItem('selectedItemId');
    const selectedType = sessionStorage.getItem('selectedItemType');
    
    if (selectedId && selectedType === 'material') {
      // Clear the session storage
      sessionStorage.removeItem('selectedItemId');
      sessionStorage.removeItem('selectedItemType');
      
      // Find and open the material in edit modal
      const material = materials.find(m => m.id === parseInt(selectedId));
      if (material) {
        setTimeout(() => {
          openEditModal(material);
        }, 300);
      }
    }
  }, [materials]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch) {
      goToPage(1);
    }
  }, [debouncedSearch, goToPage]);

  const handleCreate = async (data: any) => {
    const result = await createMaterial(data);
    if (result) {
      success('تم إضافة المادة بنجاح');
      setIsCreateModalOpen(false);
      await getTotalCount();
      await loadMaterials({}, currentPage, ITEMS_PER_PAGE);
      loadLowStockMaterials();
    }
  };

  const handleEdit = async (data: any) => {
    if (!selectedMaterial) return;
    const result = await updateMaterial(selectedMaterial.id, data);
    if (result) {
      success('تم تحديث بيانات المادة بنجاح');
      setIsEditModalOpen(false);
      setSelectedMaterial(null);
      await loadMaterials({}, currentPage, ITEMS_PER_PAGE);
      loadLowStockMaterials();
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;
    const result = await deleteMaterial(selectedMaterial.id);
    if (result) {
      success('تم حذف المادة بنجاح');
      setIsDeleteModalOpen(false);
      setSelectedMaterial(null);
      await getTotalCount();
      await loadMaterials({}, currentPage, ITEMS_PER_PAGE);
      loadLowStockMaterials();
    }
  };

  const openEditModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleExport = async () => {
    try {
      startExport();
      const response = await window.exportApi.materials();
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
      const currentMaterials = filteredMaterials.map(material => ({
        'الكود': material.code,
        'الاسم': material.name,
        'الوحدة': material.unit,
        'الكمية': material.quantity.toString(),
        'الحد الأدنى': material.min_quantity.toString(),
        'التكلفة': formatCurrency(material.cost_per_unit),
      }));

      const columns = [
        { key: 'الكود', label: 'الكود', width: 80 },
        { key: 'الاسم', label: 'الاسم', width: 120 },
        { key: 'الوحدة', label: 'الوحدة', width: 80 },
        { key: 'الكمية', label: 'الكمية', width: 80 },
        { key: 'الحد الأدنى', label: 'الحد الأدنى', width: 80 },
        { key: 'التكلفة', label: 'التكلفة/وحدة', width: 100 },
      ];

      const response = await window.printApi.report('تقرير المواد', currentMaterials, columns);
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

  // Filter materials in real-time
  const filteredMaterials = materials.filter(m => {
    if (debouncedSearch === '') return true;
    
    const searchLower = debouncedSearch.toLowerCase();
    const stockStatus = m.quantity <= m.min_quantity ? 'مخزون منخفض' : 'متوفر';
    
    return m.name.toLowerCase().includes(searchLower) ||
      m.code.toLowerCase().includes(searchLower) ||
      m.unit.toLowerCase().includes(searchLower) ||
      stockStatus.includes(searchLower) ||
      m.quantity.toString().includes(debouncedSearch) ||
      m.min_quantity.toString().includes(debouncedSearch) ||
      m.cost_per_unit.toString().includes(debouncedSearch);
  });

  const columns = [
    { key: 'code', label: 'الكود', width: '100px' },
    { key: 'name', label: 'اسم المادة' },
    { key: 'category', label: 'الفئة', render: (m: Material) => m.category || '-' },
    {
      key: 'quantity',
      label: 'الكمية',
      render: (material: Material) => (
        <span className={material.quantity <= material.min_quantity ? 'text-error font-medium' : ''}>
          {material.quantity} {material.unit}
        </span>
      ),
    },
    {
      key: 'supplier',
      label: 'المورد',
      render: (m: Material) => m.supplier || '-',
    },
    {
      key: 'cost_per_unit',
      label: 'التكلفة/وحدة',
      render: (m: Material) => formatCurrency(m.cost_per_unit),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (material: Material) => (
        material.quantity <= material.min_quantity ? (
          <Badge variant="error" size="sm">مخزون منخفض</Badge>
        ) : (
          <Badge variant="success" size="sm">متوفر</Badge>
        )
      ),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      width: '150px',
      render: (material: Material) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(material);
            }}
            className="p-2 rounded-lg text-theme-primary transition-colors hover:bg-theme-surface-hover"
            title="تعديل"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(material);
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
            إدارة المواد
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            إدارة مخزون المواد والمستلزمات
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
            <span>إضافة مادة</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <div className="card bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-1">
                تنبيه المخزون
              </h4>
              <p className="text-sm text-warning-700 dark:text-warning-300 mb-2">
                {lowStockMaterials.length} مادة تحتاج إلى إعادة طلب
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockMaterials.map(m => (
                  <Badge key={m.id} variant="warning" size="sm">
                    {m.name} ({m.quantity} {m.unit})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            ref={searchInputRef}
            placeholder="بحث في جميع الحقول (الكود، الاسم، الوحدة، الكمية، الحد الأدنى، التكلفة، الحالة...)"
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
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }} />
                <span>
                  عرض {filteredMaterials.length} من {materials.length} مادة في الصفحة الحالية
                </span>
              </>
            ) : (
              <span>
                إجمالي المواد: {totalCount} | الصفحة {currentPage} من {totalPages}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} columns={8} />
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="heading-3 text-neutral-900 dark:text-white mb-2">
              {materials.length === 0 ? 'لا توجد مواد حالياً' : 'لا توجد نتائج مطابقة'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {materials.length === 0 
                ? 'ابدأ بإضافة أول مادة في النظام'
                : 'جرب كلمة بحث أخرى'
              }
            </p>
            {materials.length === 0 ? (
              <button className="btn-base btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>إضافة مادة</span>
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
              data={filteredMaterials}
              keyExtractor={(material) => material.id}
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
        title="إضافة مادة جديدة"
        size="lg"
      >
        <MaterialForm
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
          setSelectedMaterial(null);
        }}
        title="تعديل بيانات المادة"
        size="lg"
      >
        {selectedMaterial && (
          <MaterialForm
            initialData={selectedMaterial}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedMaterial(null);
            }}
            isLoading={loading}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMaterial(null);
        }}
        title="تأكيد الحذف"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMaterial(null);
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
          هل أنت متأكد من حذف المادة <strong>{selectedMaterial?.name}</strong>؟
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