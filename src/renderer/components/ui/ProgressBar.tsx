import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  message?: string;
  variant?: 'default' | 'success' | 'error';
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  message, 
  variant = 'default',
  showPercentage = true 
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className="w-full space-y-2">
      {message && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">{message}</span>
          {showPercentage && (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {Math.round(displayProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getVariantClasses()}`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
}

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  onClose?: () => void;
}

export function ExportProgressModal({ 
  isOpen, 
  progress, 
  message,
  onClose 
}: ExportProgressModalProps) {
  if (!isOpen) return null;

  const isComplete = progress === 100;
  const isError = progress === 0 && message.includes('فشل');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isError ? 'خطأ في التصدير' : isComplete ? 'اكتمل التصدير' : 'جاري التصدير...'}
            </h3>
            {isComplete && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <ProgressBar
            progress={progress}
            message={message}
            variant={isError ? 'error' : isComplete ? 'success' : 'default'}
            showPercentage={!isError}
          />

          {isComplete && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">تم التصدير بنجاح!</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm font-medium">حدث خطأ أثناء التصدير</span>
            </div>
          )}

          {(isComplete || isError) && onClose && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}