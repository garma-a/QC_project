'use client';

import { Suspense } from 'react';
import { MonitorClient } from '@/features/machines/components/MonitorClient';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';

export default function DashboardPage() {
  const { data, isLoading, isFetching, error } = useDashboardData();

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <div className="text-[#c41e3a] dark:text-[#e84855] text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to load dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">{error || 'Unknown error'}</p>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative">
      {/* Subtle background refetch indicator */}
      {isFetching && !isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
          <div className="h-full bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] animate-pulse rounded-full" />
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8">


        <Suspense fallback={<DashboardSkeleton />}>
          <MonitorClient
            machines={data.machines}
            categories={data.categories}
            qcHistory={data.qcHistory}
            isFetching={isFetching}
          />
        </Suspense>
      </div>
    </div>
  );
}
