import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-theme-primary text-white hover:bg-theme-primary-hover active:bg-theme-primary-active focus:ring-theme-primary shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/20',
    secondary: 'bg-theme-secondary text-white hover:bg-theme-secondary-hover active:bg-theme-secondary-active focus:ring-theme-secondary shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/20',
    danger: 'bg-error-600 dark:bg-error-700 text-white hover:bg-error-700 dark:hover:bg-error-600 active:bg-error-800 focus:ring-error-500 dark:focus:ring-error-400 shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/20',
    success: 'bg-success-600 dark:bg-success-700 text-white hover:bg-success-700 dark:hover:bg-success-600 active:bg-success-800 focus:ring-success-500 dark:focus:ring-success-400 shadow-sm hover:shadow-md dark:shadow-lg dark:shadow-black/20',
    outline: 'border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-500 focus:ring-theme-primary dark:ring-offset-neutral-900',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  );
}