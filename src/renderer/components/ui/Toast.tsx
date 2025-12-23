import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast as ToastType } from '../../hooks/useToast';

export interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const variantClasses = {
    success: 'bg-success-50 border-success-500 text-success-700',
    error: 'bg-error-50 border-error-500 text-error-700',
    warning: 'bg-warning-50 border-warning-500 text-warning-700',
    info: 'border-theme-primary text-theme-primary',
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border-r-4
        bg-white shadow-lg backdrop-blur-sm
        ${variantClasses[toast.type]}
        animate-slideDown transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5
      `}
      style={toast.type === 'info' ? {
        backgroundColor: 'var(--color-primary)',
        opacity: 0.05,
      } : undefined}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {toast.message}
      </p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-110"
        aria-label="إغلاق"
      >
        <X size={16} className="text-neutral-600 dark:text-neutral-400" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}