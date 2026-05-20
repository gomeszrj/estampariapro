import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** Single animated skeleton block */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] rounded-lg ${className}`}
    style={{ animation: 'shimmer 1.5s infinite' }}
  />
);

/** Full-page skeleton for dashboard/list views */
export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 p-1">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-32" />
    </div>
    {/* Stat cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
    {/* Table rows */}
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-700/30 last:border-0">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>

    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `}</style>
  </div>
);

/** Skeleton for a card grid (e.g. Products, Kanban) */
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1 rounded-xl" />
          <Skeleton className="h-8 flex-1 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
