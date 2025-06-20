// LoadingSkeleton.jsx
import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="bg-neutral-800 rounded-xl shadow-md overflow-hidden border border-neutral-700 min-h-[350px] sm:min-h-[400px]">
      <div className="p-6 sm:p-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center mb-6">
          <div>
            <div className="h-6 sm:h-8 animate-shimmer rounded-md w-32 sm:w-40 mb-2"></div>
            <div className="h-4 animate-shimmer rounded-md w-20 sm:w-24"></div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="py-3 sm:py-4 px-2 sm:px-3 bg-neutral-700/50 rounded-lg border border-neutral-600"
            >
              <div className="h-3 animate-shimmer rounded w-12 mx-auto mb-2"></div>
              <div className="h-6 sm:h-8 animate-shimmer rounded w-8 mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Summary stats skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 animate-shimmer rounded w-20"></div>
            <div className="h-5 animate-shimmer rounded w-12"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 animate-shimmer rounded w-24"></div>
            <div className="h-5 animate-shimmer rounded w-16"></div>
          </div>
        </div>

        {/* Recent problems skeleton */}
        <div className="mt-6 pt-4 border-t border-neutral-700">
          <div className="h-4 animate-shimmer rounded w-28 mb-3"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="p-3 sm:p-4 bg-neutral-700/30 rounded-lg border border-neutral-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 animate-shimmer rounded w-3/4"></div>
                  <div className="h-5 animate-shimmer rounded w-12"></div>
                </div>
                <div className="h-3 animate-shimmer rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized loading components for different sections
export const ProfileSkeleton = () => (
  <div className="text-center space-y-3">
    <div className="w-10 h-10 bg-neutral-700 rounded-full animate-pulse mx-auto"></div>
    <div className="space-y-2">
      <div className="h-4 bg-neutral-700 rounded animate-pulse"></div>
      <div className="h-3 bg-neutral-700 rounded w-3/4 mx-auto animate-pulse"></div>
    </div>
  </div>
);

export const SidebarSkeleton = () => (
  <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-lg border border-neutral-700">
    <div className="space-y-3">
      <div className="h-4 bg-neutral-700 rounded animate-pulse w-1/3"></div>
      <div className="h-8 bg-neutral-700 rounded animate-pulse"></div>
    </div>
  </div>
);

export const LargeSpinnerSkeleton = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-12 h-12 border-4 border-neutral-700 border-t-amber-500 rounded-full animate-spin"></div>
  </div>
);
