export default function MachinesLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800/50 rounded relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>

      <div className="glass-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg relative overflow-hidden" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg relative overflow-hidden" />
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded relative overflow-hidden" />
          ))}
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="grid grid-cols-5 gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} className="h-5 w-full max-w-[80%] bg-gray-100 dark:bg-gray-800/60 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
