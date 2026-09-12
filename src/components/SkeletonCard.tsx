import React from 'react';

interface SkeletonCardProps {
  count?: number;
  type?: 'ticket' | 'dish' | 'party';
  className?: string;
}

export default function SkeletonCard({
  count = 3,
  type = 'ticket',
  className = '',
}: SkeletonCardProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'dish') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${className}`}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-[#EADCCF]/70 p-3.5 flex items-center gap-3.5 elevation-1 animate-pulse"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl skeleton-box flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 skeleton-box" />
              <div className="h-3 w-5/6 skeleton-box" />
              <div className="h-4 w-1/3 skeleton-box mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'party') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-[#EADCCF]/70 p-5 space-y-4 elevation-1 animate-pulse"
          >
            <div className="h-5 w-1/3 skeleton-box" />
            <div className="h-5 w-3/4 skeleton-box" />
            <div className="space-y-1.5">
              <div className="h-3 w-full skeleton-box" />
              <div className="h-3 w-4/5 skeleton-box" />
            </div>
            <div className="pt-3 border-t border-[#EADCCF]/40 flex justify-between">
              <div className="h-4 w-1/4 skeleton-box" />
              <div className="h-6 w-1/4 skeleton-box" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: Ticket Package Skeleton
  return (
    <div className={`space-y-3.5 ${className}`}>
      {items.map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white border border-[#EADCCF]/70 p-5 sm:p-6 elevation-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl skeleton-box flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-1/2 skeleton-box" />
              <div className="h-3 w-3/4 skeleton-box" />
              <div className="h-3 w-2/5 skeleton-box" />
            </div>
          </div>
          <div className="w-24 h-8 skeleton-box self-end sm:self-center flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
