import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'table';
  lines?: number;
  height?: string;
  width?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', lines = 1, height, width, ...props }, ref) => {
    const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";
    
    if (variant === 'text') {
      return (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              ref={index === 0 ? ref : undefined}
              className={cn(
                baseClasses,
                "h-4",
                index === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
                className
              )}
              style={{ height, width }}
              {...props}
            />
          ))}
        </div>
      );
    }

    if (variant === 'card') {
      return (
        <div
          ref={ref}
          className={cn(
            "p-4 space-y-3 border rounded-lg",
            className
          )}
          {...props}
        >
          <div className="flex items-center space-x-3">
            <div className={cn(baseClasses, "h-10 w-10 rounded-full")} />
            <div className="space-y-2 flex-1">
              <div className={cn(baseClasses, "h-4 w-1/2")} />
              <div className={cn(baseClasses, "h-3 w-3/4")} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={cn(baseClasses, "h-3 w-full")} />
            <div className={cn(baseClasses, "h-3 w-5/6")} />
            <div className={cn(baseClasses, "h-3 w-4/6")} />
          </div>
        </div>
      );
    }

    if (variant === 'avatar') {
      return (
        <div
          ref={ref}
          className={cn(
            baseClasses,
            "rounded-full h-10 w-10",
            className
          )}
          style={{ height, width }}
          {...props}
        />
      );
    }

    if (variant === 'button') {
      return (
        <div
          ref={ref}
          className={cn(
            baseClasses,
            "h-10 w-24",
            className
          )}
          style={{ height, width }}
          {...props}
        />
      );
    }

    if (variant === 'table') {
      return (
        <div
          ref={ref}
          className={cn("space-y-3", className)}
          {...props}
        >
          {/* Header */}
          <div className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={cn(baseClasses, "h-4 flex-1")} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: lines || 5 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex space-x-4">
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <div key={colIndex} className={cn(baseClasses, "h-3 flex-1")} />
              ))}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, "h-4 w-full", className)}
        style={{ height, width }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// Preset components for common use cases
export const SkeletonCard = ({ className, ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="card" className={className} {...props} />
);

export const SkeletonText = ({ className, lines = 3, ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="text" lines={lines} className={className} {...props} />
);

export const SkeletonAvatar = ({ className, ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="avatar" className={className} {...props} />
);

export const SkeletonButton = ({ className, ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="button" className={className} {...props} />
);

export const SkeletonTable = ({ className, rows = 5, ...props }: Omit<SkeletonProps, 'variant' | 'lines'>) => (
  <Skeleton variant="table" lines={rows} className={className} {...props} />
);

// Dashboard specific skeletons
export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <SkeletonText lines={2} className="w-1/3" />
      <SkeletonButton />
    </div>
    
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <SkeletonText lines={1} className="w-1/2" />
            <SkeletonAvatar className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <SkeletonText lines={1} className="w-3/4" />
        </div>
      ))}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export const QuotationListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="p-4 border rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, btnIndex) => (
            <SkeletonButton key={btnIndex} className="h-8 w-16" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const ScheduleSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export { Skeleton };