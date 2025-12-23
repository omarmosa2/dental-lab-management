import { type ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'لا توجد بيانات',
  className = '',
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onRowClick?.(item)}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex justify-between items-start py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {col.mobileLabel || col.label}
                  </span>
                  <span className="text-sm text-neutral-900 dark:text-white text-left">
                    {col.render(item)}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-sm text-neutral-900 dark:text-white"
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}