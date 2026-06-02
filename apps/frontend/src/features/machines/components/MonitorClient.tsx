"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Activity, Calendar, AlertCircle, CheckCircle, BarChart3, ChevronRight } from 'lucide-react';
import { MachineCharts } from '@/features/machines/components/MachineCharts';
import { LogoCompact } from '@/components/layout/Logo';

import type { MachineResponseDto, QcResultResponseDto } from '@/lib/types/api';

type MonitorResultEntry = QcResultResponseDto & {
  machineId: number;
  testId: number;
  testName: string;
  lotId: number;
  level: number;
  lotNumber: string;
};

type MonitorClientProps = {
  machines: (MachineResponseDto & {
    testsToday?: number;
    lastQC?: { date: string; status: string };
    tests?: {
      id: string;
      name: string;
      category: string;
      code: string;
      unit: string;
      lowRange: number;
      highRange: number;
      lotId: number;
      level: number;
      lotNumber: string;
      isActive: boolean;
      mean: number;
      standardDeviation: number;
    }[];
  })[];
  categories: { id: string; name: string }[];
  qcHistory: MonitorResultEntry[];
};

export function MonitorClient({ machines, categories, qcHistory }: MonitorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedMachineId = searchParams.get('machineId');
  const tabParam = searchParams.get('tab');
  const activeTab: 'overview' | 'charts' = tabParam === 'charts' ? 'charts' : 'overview';
  const setUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const machine = machines.find(m => m.id.toString() === selectedMachineId);
  const history = selectedMachineId
    ? qcHistory.filter((entry) => entry.machineId.toString() === selectedMachineId)
    : [];

  // Show machine selection if no machine is selected
  if (!selectedMachineId || !machine) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div />
          <div className="lg:hidden">
            <LogoCompact />
          </div>
        </div>

        {/* Decorative line */}
        <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mb-6" />

        {/* Machines grouped by category */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryMachines = machines.filter(m => m.sectionId?.toString() === category.id);
            
            return (
              <div key={category.id}>
                <h2 className="text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-gradient-to-b from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] rounded-full" />
                  <span className="font-semibold">{category.name}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryMachines.map(machine => (
                    <div
                      key={machine.id}
                      className="group bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 hover:shadow-2xl hover:shadow-[#c41e3a]/20 dark:hover:shadow-[#e84855]/30 transition-all cursor-pointer hover:border-[#c41e3a] dark:hover:border-[#e84855] hover:-translate-y-1 myc-pattern relative"
                      onClick={() => setUrlParams({ machineId: machine.id.toString(), tab: null, testId: null })}
                    >
                      {/* Corner accent */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full" />
                      
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 dark:text-white mb-1 truncate group-hover:text-[#c41e3a] dark:group-hover:text-[#e84855] transition-colors font-semibold">{machine.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{machine.hospCode}</p>
                        </div>
                        <div className="relative flex-shrink-0 ml-2">
                          <div className={`w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-[#1e1e1e] ${
                            machine.currentStatus === 'IDLE' || machine.currentStatus === 'RUNNING' ? 'bg-[#10b981]' : 
                            machine.currentStatus === 'MAINTENANCE' ? 'bg-[#f59e0b]' : 'bg-[#c41e3a]'
                          }`} />
                          <div className={`absolute inset-0 w-3.5 h-3.5 rounded-full animate-ping opacity-75 ${
                            machine.currentStatus === 'IDLE' || machine.currentStatus === 'RUNNING' ? 'bg-[#10b981]' : 
                            machine.currentStatus === 'MAINTENANCE' ? 'bg-[#f59e0b]' : 'bg-[#c41e3a]'
                          }`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 relative z-10">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {machine.lastQC?.status === 'pass' ? (
                            <CheckCircle size={18} className="text-[#10b981] flex-shrink-0" />
                          ) : (
                            <AlertCircle size={18} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            Last QC: {machine.lastQC?.date ?? 'Unknown'}
                          </span>
                        </div>
                        <ChevronRight size={20} className="text-[#b8860b] dark:text-[#ffd700] flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setUrlParams({ machineId: null, tab: null, testId: null })} 
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 text-[#c41e3a] dark:text-[#e84855] hover:bg-[#c41e3a] hover:text-white dark:hover:bg-[#e84855] dark:hover:text-white transition-all font-medium cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
        <div className="lg:hidden">
          <LogoCompact />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-6 border-b-2 border-[#c41e3a]/20 dark:border-[#e84855]/30">
        <button
          onClick={() => setUrlParams({ tab: 'overview' })}
          className={`pb-3 px-4 transition-all font-medium cursor-pointer rounded-t-lg ${
            activeTab === 'overview'
              ? 'text-[#c41e3a] dark:text-[#e84855] border-b-2 border-[#c41e3a] dark:border-[#e84855]'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setUrlParams({ tab: 'charts' })}
          className={`pb-3 px-4 flex items-center gap-2 transition-all font-medium cursor-pointer rounded-t-lg ${
            activeTab === 'charts'
              ? 'text-[#c41e3a] dark:text-[#e84855] border-b-2 border-[#c41e3a] dark:border-[#e84855]'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div>

        {/* Machine Header */}
        <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 px-5 py-3 sm:px-6 sm:py-4 mb-6 shadow-lg myc-pattern relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full" />
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2 relative z-10">
            <div className="flex-1 min-w-0">
              <h1 className="text-gray-900 dark:text-white mb-1 break-words font-bold">{machine.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{machine.hospCode}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap self-start border-2 ${
              machine.currentStatus === 'IDLE' || machine.currentStatus === 'RUNNING' ? 'bg-[#10b981]/10 dark:bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' :
              machine.currentStatus === 'MAINTENANCE' ? 'bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30' :
              'bg-[#c41e3a]/10 dark:bg-[#e84855]/20 text-[#c41e3a] dark:text-[#e84855] border-[#c41e3a]/30 dark:border-[#e84855]/30'
            }`}>
              {machine.currentStatus.charAt(0).toUpperCase() + machine.currentStatus.slice(1).toLowerCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 pt-3 border-t-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 relative z-10">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Section ID</p>
              <p className="text-gray-900 dark:text-white font-medium capitalize">{machine.sectionId}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Created At</p>
              <p className="text-gray-900 dark:text-white font-medium">{machine.createdAt ? new Date(machine.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Updated At</p>
              <p className="text-gray-900 dark:text-white font-medium">{machine.updatedAt ? new Date(machine.updatedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#c41e3a]/10 dark:bg-[#e84855]/20 rounded-lg">
                <Activity className="text-[#c41e3a] dark:text-[#e84855]" size={20} />
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold">Tests Today</h3>
            </div>
            <p className="text-gray-900 dark:text-white text-2xl font-bold">{machine.testsToday ?? 0}</p>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#b8860b]/20 dark:border-[#ffd700]/30 p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#b8860b]/10 dark:bg-[#ffd700]/20 rounded-lg">
                <Calendar className="text-[#b8860b] dark:text-[#ffd700]" size={20} />
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold">Last QC</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{machine.lastQC?.date ?? 'N/A'}</p>
          </div>

          <div className={`rounded-2xl border-2 p-5 shadow-lg ${
             machine.lastQC?.status === 'pass' 
               ? 'bg-white dark:bg-[#1e1e1e] border-[#10b981]/30'
               : 'bg-white dark:bg-[#1e1e1e] border-[#c41e3a]/30 dark:border-[#e84855]/30'
           }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                machine.lastQC?.status === 'pass'
                  ? 'bg-[#10b981]/10 dark:bg-[#10b981]/20'
                  : 'bg-[#c41e3a]/10 dark:bg-[#e84855]/20'
              }`}>
                 {machine.lastQC?.status === 'pass' ? (
                   <CheckCircle className="text-[#10b981]" size={20} />
                 ) : (
                   <AlertCircle className="text-[#c41e3a] dark:text-[#e84855]" size={20} />
                 )}
              </div>
              <h3 className="text-gray-900 dark:text-white font-semibold">QC Status</h3>
            </div>
             <p className={`text-lg font-bold ${machine.lastQC?.status === 'pass' ? 'text-[#10b981]' : machine.lastQC?.status === 'warning' ? 'text-[#b8860b] dark:text-[#ffd700]' : 'text-[#c41e3a] dark:text-[#e84855]'}`}>
               {machine.lastQC?.status?.toUpperCase() ?? 'UNKNOWN'}
             </p>
           </div>
        </div>

        {/* Available Tests (Placeholder until Control Lots are wired) */}
        {machine.tests && machine.tests.length > 0 && (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 mb-6 shadow-lg">
            <h2 className="text-gray-900 dark:text-white mb-4 font-bold">Available Tests ({machine.tests.length})</h2>
            <div className="p-4 bg-[#fff8f0] dark:bg-[#2a2a2a] rounded-xl border border-[#c41e3a]/20 dark:border-[#e84855]/30 text-gray-600 dark:text-gray-400 text-sm">
               Test details will be loaded from real control lots.
            </div>
          </div>
        )}

        {/* QC History */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 shadow-lg">
          <h2 className="text-gray-900 dark:text-white mb-4 font-bold">Quality Control History</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((qc) => (
              <div key={qc.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] border border-[#c41e3a]/10 dark:border-[#e84855]/20 group hover:border-[#c41e3a]/30 dark:hover:border-[#e84855]/40 transition-colors">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  qc.status === 'PASS' ? 'bg-[#10b981]' :
                  qc.status === 'WARNING' ? 'bg-[#f59e0b]' : 'bg-[#c41e3a]'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{qc.testName}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{new Date(qc.testDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                     <span className="text-gray-600 dark:text-gray-400 truncate">By User {qc.performedBy}</span>
                     <span className="text-gray-300 dark:text-gray-600">•</span>
                     <span className="font-medium text-gray-900 dark:text-white">Val: {qc.measuredValue}</span>
                     <span className="text-gray-300 dark:text-gray-600">•</span>
                     <span className="text-gray-600 dark:text-gray-400 truncate">Lot: {qc.lotNumber}</span>
                   </div>
                 </div>
               </div>
             ))}
            {history.length === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">No QC history found for this machine.</p>
            )}
          </div>
        </div>
        </div>
      ) : (
        <MachineCharts
          machine={machine}
          qcHistory={history}
        />
      )}
    </div>
  );
}
