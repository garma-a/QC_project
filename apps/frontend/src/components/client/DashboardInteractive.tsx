"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, XCircle, AlertTriangle } from 'lucide-react';

type DashboardInteractiveProps = {
  machinesWithStatus: {
    id: string;
    category: string;
    name: string;
    model: string;
    status: string;
    qcStatus: string;
    violationCount: number;
    lastQC?: { date: string };
  }[];
  categories: { id: string; name: string }[];
};

export function DashboardInteractive({ machinesWithStatus, categories }: DashboardInteractiveProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  const filteredMachines = selectedCategory === 'all'
    ? machinesWithStatus
    : machinesWithStatus.filter(m => m.category === selectedCategory);

  return (
    <>
      {/* Category Filter - Magdi Yacoub Styled */}
      <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm sm:text-base font-medium ${selectedCategory === 'all'
              ? 'bg-[#8b1e3f] dark:bg-[#8b1e3f] text-white dark:shadow-lg dark:shadow-[#8b1e3f]/30 border-2 border-[#b8860b] dark:border-[#b8860b]'
              : 'bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] hover:border-[#c41e3a] dark:hover:border-[#e84855]'
            }`}
        >
          All Machines
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm sm:text-base font-medium ${selectedCategory === category.id
                ? 'bg-[#8b1e3f] dark:bg-[#8b1e3f] text-white shadow-lg shadow-[#8b1e3f]/30 border-2 border-[#b8860b] dark:border-[#b8860b]'
                : 'bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] hover:border-[#c41e3a] dark:hover:border-[#e84855]'
              }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Machine Grid - Magdi Yacoub Branded Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredMachines.map(machine => {
          const categoryInfo = categories.find(c => c.id === machine.category);

          return (
            <div
              key={machine.id}
              className="group relative bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 hover:shadow-2xl hover:shadow-[#c41e3a]/20 dark:hover:shadow-[#e84855]/30 transition-all cursor-pointer hover:border-[#c41e3a] dark:hover:border-[#e84855] hover:-translate-y-1 myc-pattern"
              onClick={() => router.push(`/monitor?machineId=${machine.id}`)}
            >
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#b8860b]/10 to-transparent dark:from-[#ffd700]/10 rounded-bl-full opacity-50" />

              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white mb-1.5 truncate group-hover:text-[#c41e3a] dark:group-hover:text-[#e84855] transition-colors font-semibold text-lg">
                    {machine.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{machine.model}</p>
                </div>
                <div className="relative flex-shrink-0 ml-2">
                  <div className={`w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-[#1e1e1e] ${machine.status === 'operational' ? 'bg-[#10b981]' :
                      machine.status === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#c41e3a]'
                    }`} />
                  <div className={`absolute inset-0 w-3.5 h-3.5 rounded-full animate-ping opacity-75 ${machine.status === 'operational' ? 'bg-[#10b981]' :
                      machine.status === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#c41e3a]'
                    }`} />
                </div>
              </div>

              <div className="mb-4 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#c41e3a]/10 to-[#b8860b]/10 dark:from-[#e84855]/20 dark:to-[#ffd700]/20 text-[#c41e3a] dark:text-[#e84855] rounded-lg text-sm border border-[#c41e3a]/30 dark:border-[#e84855]/40 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#b8860b] dark:bg-[#ffd700]" />
                  {categoryInfo?.name}
                </span>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {machine.qcStatus === 'pass' ? (
                      <CheckCircle size={18} className="text-[#10b981] flex-shrink-0" />
                    ) : machine.qcStatus === 'warning' ? (
                      <AlertTriangle size={18} className="text-[#f59e0b] flex-shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                      QC Status: {machine.qcStatus === 'pass' ? 'Normal' : machine.qcStatus === 'warning' ? 'Warning' : 'Reject'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#b8860b] dark:text-[#ffd700] group-hover:gap-2 transition-all">
                    <span className="text-xs font-medium hidden sm:inline">View</span>
                    <ChevronRight size={20} className="flex-shrink-0" />
                  </div>
                </div>

                {machine.violationCount > 0 && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${machine.qcStatus === 'error'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                    {machine.violationCount} Westgard rule violation{machine.violationCount > 1 ? 's' : ''}
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last QC: {machine.lastQC?.date ?? 'N/A'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
