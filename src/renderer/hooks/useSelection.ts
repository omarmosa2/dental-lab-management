import { useState, useCallback } from 'react';

/**
 * Hook لإدارة التحديد الجماعي للعناصر
 * @template T نوع العنصر
 */
export function useSelection<T extends { id: number }>() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /**
   * تحديد/إلغاء تحديد عنصر واحد
   */
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  /**
   * تحديد جميع العناصر
   */
  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, []);

  /**
   * إلغاء تحديد جميع العناصر
   */
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * التحقق من تحديد عنصر
   */
  const isSelected = useCallback(
    (id: number) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  /**
   * الحصول على العناصر المحددة
   */
  const getSelectedItems = useCallback(
    (items: T[]) => {
      return items.filter((item) => selectedIds.has(item.id));
    },
    [selectedIds]
  );

  /**
   * عدد العناصر المحددة
   */
  const selectedCount = selectedIds.size;

  /**
   * هل جميع العناصر محددة
   */
  const isAllSelected = useCallback(
    (items: T[]) => {
      return items.length > 0 && items.every((item) => selectedIds.has(item.id));
    },
    [selectedIds]
  );

  /**
   * هل بعض العناصر محددة (لكن ليس الكل)
   */
  const isSomeSelected = useCallback(
    (items: T[]) => {
      return selectedIds.size > 0 && !isAllSelected(items);
    },
    [selectedIds, isAllSelected]
  );

  return {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    getSelectedItems,
    isAllSelected,
    isSomeSelected,
  };
}