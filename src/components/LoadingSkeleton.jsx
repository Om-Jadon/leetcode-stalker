// LoadingSkeleton.jsx
import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-700 min-h-[350px] sm:min-h-[400px]">
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
              className="py-3 sm:py-4 px-2 sm:px-3 bg-gray-700/50 rounded-lg border border-gray-600"
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
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="h-4 animate-shimmer rounded w-28 mb-3"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-600"
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
