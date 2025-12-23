import { type ReactNode, type HTMLAttributes } from 'react';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glass';
  hover?: boolean;
  glow?: boolean;
  children: ReactNode;
}

export function AnimatedCard({
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  children,
  ...props
}: AnimatedCardProps) {
  const variantClasses = {
    default: 'bg-white shadow-sm',
    bordered: 'bg-white border-2 border-neutral-200',
    elevated: 'bg-white shadow-lg',
    glass: 'bg-white/70 backdrop-blur-md border border-white/30',
  };

  const hoverClasses = hover
    ? 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl'
    : 'transition-all duration-200';

  const glowClasses = glow
    ? 'hover:shadow-primary-500/20 dark:hover:shadow-primary-500/30'
    : '';

  return (
    <div
      className={`rounded-lg p-6 ${variantClasses[variant]} ${hoverClasses} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface AnimatedCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function AnimatedCardHeader({ title, subtitle, action, icon }: AnimatedCardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-neutral-200">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2 rounded-lg text-theme-primary" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-neutral-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function AnimatedCardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-neutral-700 ${className}`}>
      {children}
    </div>
  );
}

export function AnimatedCardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}