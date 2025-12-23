import { type ButtonHTMLAttributes, type ReactNode, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ripple?: boolean;
  children: ReactNode;
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  ripple = true,
  className = '',
  children,
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && !disabled && !isLoading) {
      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        setRipples((prev) => [...prev, { x, y, id }]);

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
    }

    if (onClick && !disabled && !isLoading) {
      onClick(e);
    }
  };

  const variantClasses = {
    primary: 'bg-theme-primary text-white hover:bg-theme-primary-hover active:bg-theme-primary-active shadow-sm hover:shadow-md',
    secondary: 'bg-theme-secondary text-white hover:bg-theme-secondary-hover active:bg-theme-secondary-active shadow-sm hover:shadow-md',
    outline: 'bg-transparent border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
    danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-sm hover:shadow-md',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-out relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary';

  const hoverClasses = !disabled && !isLoading ? 'hover:-translate-y-0.5 active:translate-y-0' : '';

  return (
    <button
      ref={buttonRef}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple Effect */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
          }}
        />
      ))}

      {/* Loading Spinner */}
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}

      {/* Left Icon */}
      {!isLoading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}

      {/* Content */}
      <span className="flex-1">{children}</span>

      {/* Right Icon */}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}