import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full" dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 text-right">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2 rounded-lg border text-right
            ${icon ? 'pr-10' : ''}
            ${error 
              ? 'border-error-500 dark:border-error-400 focus:ring-error-500 dark:focus:ring-error-400 focus:border-error-500 dark:focus:border-error-400' 
              : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400'
            }
            bg-white dark:bg-neutral-800
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-error text-right">{error}</p>
      )}
    </div>
  );
}