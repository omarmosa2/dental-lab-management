import { X, Trash2, Download, CheckSquare } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onCustomAction?: (action: string) => void;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    action: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExport,
  onCustomAction,
  customActions = [],
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
      <div className="bg-white rounded-lg shadow-2xl border border-neutral-200 px-6 py-4 flex items-center gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3 pl-4 border-l-2 border-theme-primary">
          <CheckSquare className="w-5 h-5 text-theme-primary" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {selectedCount} محدد
            </p>
            <p className="text-xs text-neutral-600">
              من أصل {totalCount}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-neutral-200" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Select/Deselect All */}
          {!allSelected ? (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              leftIcon={<CheckSquare className="w-4 h-4" />}
            >
              تحديد الكل
            </AnimatedButton>
          ) : (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              leftIcon={<X className="w-4 h-4" />}
            >
              إلغاء التحديد
            </AnimatedButton>
          )}

          {/* Export */}
          {onExport && (
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={onExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              تصدير ({selectedCount})
            </AnimatedButton>
          )}

          {/* Custom Actions */}
          {customActions.map((action, index) => (
            <AnimatedButton
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => onCustomAction?.(action.action)}
              leftIcon={action.icon}
            >
              {action.label}
            </AnimatedButton>
          ))}

          {/* Delete */}
          {onDelete && (
            <AnimatedButton
              variant="danger"
              size="sm"
              onClick={onDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              حذف ({selectedCount})
            </AnimatedButton>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onDeselectAll}
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-neutral-600" />
        </button>
      </div>
    </div>
  );
}