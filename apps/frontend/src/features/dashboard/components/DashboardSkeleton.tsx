"use client";

/**
 * Skeleton loading state for the Dashboard.
 * Shows pulsing card placeholders that match the machine grid layout,
 * giving users spatial context of what's loading instead of a plain spinner.
 */
export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Header decorative line skeleton */}
      <div className="mb-6">
        <div className="h-1 bg-gradient-to-r from-[#c41e3a]/30 via-[#b8860b]/30 to-[#003366]/30 dark:from-[#e84855]/30 dark:via-[#ffd700]/30 dark:to-[#4a90e2]/30 rounded-full" />
      </div>

      {/* Section header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-7 bg-[#c41e3a]/20 dark:bg-[#e84855]/20 rounded-full animate-pulse" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      {/* Machine cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/15 p-5 sm:p-6 relative overflow-hidden"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]">
              <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
            </div>

            {/* Corner accent skeleton */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#b8860b]/5 to-transparent dark:from-[#ffd700]/5 rounded-bl-full" />

            {/* Title area */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ml-2" />
            </div>

            {/* Category badge skeleton */}
            <div className="mb-4">
              <div className="h-7 w-24 bg-[#c41e3a]/5 dark:bg-[#e84855]/10 rounded-lg animate-pulse" />
            </div>

            {/* Bottom section */}
            <div className="pt-4 border-t-2 border-[#c41e3a]/5 dark:border-[#e84855]/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
