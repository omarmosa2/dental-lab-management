import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export function Dropdown({ 
  trigger, 
  children, 
  align = 'right',
  className = '',
  open: controlledOpen,
  onOpenChange,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' as string | number });

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef.current && contentRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current || !contentRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const margin = 16;
        let top = triggerRect.bottom + 8;
        let left: number | string = 'auto';
        const right: number | string = 'auto';

        // Horizontal positioning
        if (align === 'left') {
          // Try to align to the right edge of trigger
          left = triggerRect.right - contentRect.width;
          
          // Check if it goes off the left edge
          if (left < margin) {
            left = margin;
          }
          
          // Check if it goes off the right edge
          if (left + contentRect.width > viewportWidth - margin) {
            left = viewportWidth - contentRect.width - margin;
          }
        } else {
          // Try to align to the left edge of trigger
          left = triggerRect.left;
          
          // Check if it goes off the right edge
          if (left + contentRect.width > viewportWidth - margin) {
            left = viewportWidth - contentRect.width - margin;
          }
          
          // Check if it goes off the left edge
          if (left < margin) {
            left = margin;
          }
        }

        // Vertical positioning
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        if (spaceBelow < contentRect.height + margin && spaceAbove > spaceBelow) {
          // Open upward
          top = triggerRect.top - contentRect.height - 8;
        }

        // Ensure it doesn't go off the top
        if (top < margin) {
          top = margin;
        }

        // Ensure it doesn't go off the bottom
        if (top + contentRect.height > viewportHeight - margin) {
          top = viewportHeight - contentRect.height - margin;
        }

        setPosition({ top, left, right });
      };

      // Initial position
      updatePosition();

      // Update on scroll or resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef}>
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={contentRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: typeof position.left === 'number' ? `${position.left}px` : position.left,
            right: typeof position.right === 'number' ? `${position.right}px` : position.right,
            zIndex: 9999,
          }}
          className={`
            min-w-[200px] max-w-[min(400px,calc(100vw-2rem))]
            bg-white dark:bg-neutral-800 
            border border-neutral-200 dark:border-neutral-700
            rounded-lg shadow-xl dark:shadow-2xl dark:shadow-black/50
            py-1
            animate-in fade-in slide-in-from-top-2 duration-200
            ${className}
          `}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}

export function DropdownItem({ 
  children, 
  onClick, 
  icon,
  danger = false,
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-2 text-right flex items-center gap-3
        transition-colors
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : danger
            ? 'hover:bg-error-50 dark:hover:bg-error-900/20 text-error-600 dark:text-error-400'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white'
        }
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-sm">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />;
}

export function DropdownHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
      {children}
    </div>
  );
}