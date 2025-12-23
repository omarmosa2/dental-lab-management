import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full" dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 text-right">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2 rounded-lg border text-right
          ${error 
            ? 'border-error-500 dark:border-error-400 focus:ring-error-500 dark:focus:ring-error-400 focus:border-error-500 dark:focus:border-error-400' 
            : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400'
          }
          bg-white dark:bg-neutral-800
          text-neutral-900 dark:text-neutral-100
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option key="" value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-error text-right">{error}</p>
      )}
    </div>
  );
}