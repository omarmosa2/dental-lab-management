import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

export interface FilterField {
  type: 'search' | 'select' | 'date' | 'daterange';
  name: string;
  label?: string;
  placeholder?: string;
  value: string | [string, string];
  onChange: (value: string | [string, string]) => void;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

interface FilterBarProps {
  fields: FilterField[];
  activeFiltersCount?: number;
  onClearAll?: () => void;
  showClearButton?: boolean;
  className?: string;
  children?: ReactNode;
}

export function FilterBar({
  fields,
  activeFiltersCount = 0,
  onClearAll,
  showClearButton = true,
  className = '',
  children,
}: FilterBarProps) {
  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearAll = () => {
    fields.forEach(field => {
      if (field.type === 'daterange') {
        field.onChange(['', '']);
      } else {
        field.onChange('');
      }
    });
    onClearAll?.();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Fields */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        {fields.map((field, index) => {
          if (field.type === 'search') {
            return (
              <div key={field.name} className="flex-1 relative w-full min-w-0">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={field.placeholder || 'بحث...'}
                  className="input-base pr-10 pl-10 w-full"
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                />
                {field.value && (
                  <button
                    onClick={() => field.onChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
                    title="مسح البحث"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            );
          }

          if (field.type === 'select') {
            return (
              <div key={field.name} className={`relative ${field.className || 'min-w-[180px]'}`}>
                <select
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="input-base w-full appearance-none cursor-pointer pr-10"
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            );
          }

          if (field.type === 'date') {
            return (
              <div key={field.name} className={`relative ${field.className || 'min-w-[180px]'}`}>
                <input
                  type="date"
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="input-base w-full"
                  placeholder={field.placeholder}
                />
                {field.value && (
                  <button
                    onClick={() => field.onChange('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
                    title="مسح التاريخ"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            );
          }

          if (field.type === 'daterange') {
            const [startDate, endDate] = field.value as [string, string];
            return (
              <div key={field.name} className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => field.onChange([e.target.value, endDate])}
                  className="input-base min-w-[150px]"
                  placeholder="من تاريخ"
                />
                <span className="text-neutral-500 dark:text-neutral-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => field.onChange([startDate, e.target.value])}
                  className="input-base min-w-[150px]"
                  placeholder="إلى تاريخ"
                />
              </div>
            );
          }

          return null;
        })}

        {children}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && showClearButton && (
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>
              {activeFiltersCount} {activeFiltersCount === 1 ? 'فلتر نشط' : 'فلاتر نشطة'}
            </span>
          </div>
          <button
            onClick={handleClearAll}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline transition-colors flex items-center gap-1"
          >
            <X size={16} />
            مسح جميع الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}