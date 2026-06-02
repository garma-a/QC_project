'use client';

import { Suspense } from 'react';
import { QCHistoryInteractive } from '@/features/qc/components/QCHistoryInteractive';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function QCPage() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c41e3a] dark:border-[#e84855]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <div className="text-[#c41e3a] dark:text-[#e84855] text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load QC history</h2>
        <p className="text-gray-600 dark:text-gray-400">{error || 'Unknown error'}</p>
      </div>
    );
  }

  const machinesForQc = data.machines.map(m => ({
    id: m.id.toString(),
    name: m.name,
    category: m.sectionId.toString(),
    model: m.hospCode ?? '',
  }));

  const qcHistoryForInteractive = data.qcHistory.map(entry => ({
    id: entry.id.toString(),
    machineId: entry.machineId.toString(),
    testName: entry.testName,
    date: entry.date,
    rawDate: (entry as any).rawDate || entry.date,
    performedBy: 'User ' + entry.performedBy, // Pending backend performedBy resolution
    numericResult: entry.measuredValue,
    result: entry.measuredValue.toString(),
    expectedRange: entry.expectedRange,
    status: entry.status,
    notes: entry.comments,
    zScore: entry.zScore,
    violatedRule: entry.violatedRule,
    lotMean: entry.lotMean,
    lotSd: entry.lotSd,
  }));

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c41e3a] dark:border-[#e84855]"></div>
      </div>
    }>
      <QCHistoryInteractive 
        machines={machinesForQc}
        categories={data.categories}
        qcHistory={qcHistoryForInteractive}
      />
    </Suspense>
  );
}
