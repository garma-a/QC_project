'use client';

import { Suspense, useState } from 'react';
import { QCHistoryInteractive } from '@/features/qc/components/QCHistoryInteractive';
import { useQcPageMachines } from '@/hooks/useQcPageMachines';
import { useInfiniteQcResults } from '@/hooks/useInfiniteQcResults';

export default function QCPage() {
  const { data: pageData, isLoading: isPageLoading, error: pageError } = useQcPageMachines();
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>(undefined);
  
  const { 
    qcHistory, 
    isLoading: isQcLoading, 
    error: qcError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQcResults(selectedMachineId ? parseInt(selectedMachineId) : undefined);

  if (pageError || qcError) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-4 text-center animate-in">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <div className="text-[#c41e3a] dark:text-[#e84855] text-4xl">⚠️</div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Failed to load QC history</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">{pageError || qcError}</p>
      </div>
    );
  }

  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl relative overflow-hidden" />
        <div className="h-12 w-40 bg-gray-200 dark:bg-gray-800 rounded-xl relative overflow-hidden" />
      </div>
      <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-xl relative overflow-hidden" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded-xl relative overflow-hidden" />)}
      </div>
      <div className="space-y-4 pt-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 w-full glass-card rounded-2xl relative overflow-hidden">
             <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        ))}
      </div>
    </div>
  );

  if (isPageLoading || isQcLoading || !pageData) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in">
      <Suspense fallback={<LoadingSkeleton />}>
        <QCHistoryInteractive
          machines={pageData.machines}
          categories={pageData.categories}
          qcHistory={qcHistory}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          selectedMachineId={selectedMachineId}
          onMachineSelect={setSelectedMachineId}
        />
      </Suspense>
    </div>
  );
}
