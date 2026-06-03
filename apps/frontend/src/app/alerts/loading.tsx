export default function AlertsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
          <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800/50 rounded relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg relative overflow-hidden" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg relative overflow-hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards Skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="w-16 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* List Items Skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-card p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800/50 rounded" />
              </div>
            </div>
            <div className="w-24 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
