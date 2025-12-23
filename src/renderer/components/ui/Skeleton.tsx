import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular' 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height={20} className="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`card-${index}`} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="80%" />
          <div className="flex gap-2 pt-2">
            <Skeleton height={32} width={80} />
            <Skeleton height={32} width={80} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`field-${index}`} className="space-y-2">
          <Skeleton height={16} width={120} />
          <Skeleton height={40} width="100%" />
        </div>
      ))}
      
      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Skeleton height={40} width={100} />
        <Skeleton height={40} width={100} />
      </div>
    </div>
  );
}