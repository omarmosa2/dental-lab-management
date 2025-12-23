import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  label: string | ReactNode;
  render?: (item: T) => ReactNode;
  width?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'لا توجد بيانات',
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className="w-full">
        <thead className="bg-neutral-50 dark:bg-neutral-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`
                  bg-white dark:bg-neutral-900
                  ${onRowClick ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800' : ''}
                  transition-colors
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100"
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}