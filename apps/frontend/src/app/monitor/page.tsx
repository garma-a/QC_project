'use client';

import { Suspense } from 'react';
import { MonitorClient } from '@/features/machines/components/MonitorClient';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function MonitorPage() {
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">{error || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c41e3a] dark:border-[#e84855]"></div>
      </div>
    }>
      <MonitorClient
        machines={data.machines}
        categories={data.categories}
        qcHistory={data.qcHistory}
      />
    </Suspense>
  );
}
