import React from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = (): number[] => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const buttonBaseClasses = 'px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const buttonDefaultClasses = 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
  const buttonActiveClasses = 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700';

  return (
    <div className="flex items-center justify-center gap-2 mt-6" dir="ltr">
      {/* First Page */}
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className={`${buttonBaseClasses} ${buttonDefaultClasses}`}
          title="الصفحة الأولى"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}

      {/* Previous Page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className={`${buttonBaseClasses} ${buttonDefaultClasses}`}
        title="السابق"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Page Numbers */}
      {visiblePages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`${buttonBaseClasses} ${buttonDefaultClasses}`}
          >
            1
          </button>
          {visiblePages[0] > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${buttonBaseClasses} ${
            page === currentPage ? buttonActiveClasses : buttonDefaultClasses
          }`}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`${buttonBaseClasses} ${buttonDefaultClasses}`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={`${buttonBaseClasses} ${buttonDefaultClasses}`}
        title="التالي"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Last Page */}
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className={`${buttonBaseClasses} ${buttonDefaultClasses}`}
          title="الصفحة الأخيرة"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      )}

      {/* Page Info */}
      <div className="mr-4 text-sm text-gray-600 dark:text-gray-400">
        صفحة {currentPage} من {totalPages}
      </div>
    </div>
  );
}