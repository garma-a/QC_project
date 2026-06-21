"use client";

import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, Search } from 'lucide-react';
import { RecordQcResult } from '@/features/qc/components/RecordQcResult';
import { QCHistory } from '@/features/qc/components/QCHistory';
import { LogoCompact } from '@/components/layout/Logo';

type QcHistoryType = {
  id: string;
  machineId: string;
  testName: string;
  date: string;
  rawDate: string;
  performedBy: string;
  numericResult?: number;
  result: string;
  expectedRange: string;
  status: string;
  notes?: string | null;
  zScore: number;
  violatedRule: string | null;
  lotMean: number;
  lotSd: number;
};

export function QCHistoryInteractive({
  qcHistory,
  machines,
  categories,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  selectedMachineId,
  onMachineSelect
}: {
  qcHistory: QcHistoryType[],
  machines: { 
    id: string; category: string; name: string; model: string;
    tests: {
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
  }[],
  categories: { id: string; name: string }[],
  fetchNextPage?: () => void,
  hasNextPage?: boolean,
  isFetchingNextPage?: boolean,
  selectedMachineId?: string,
  onMachineSelect: (id: string | undefined) => void
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const years = Array.from(
    new Set(
      qcHistory
        .map((item) => {
          const parsed = new Date(item.rawDate);
          return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
        })
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 animate-slide-up">
        <div className="flex items-center gap-3 flex-1 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#c41e3a]/10 to-[#8b1e3f]/20 dark:from-[#e84855]/20 dark:to-[#c75b7a]/30 rounded-2xl ring-1 ring-[#c41e3a]/20 dark:ring-[#e84855]/30">
              <Search className="text-[#c41e3a] dark:text-[#e84855]" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                QC History
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Review historical quality control results</p>
            </div>
          </div>
          <div className="lg:hidden">
            <LogoCompact />
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg hover:shadow-[#c41e3a]/40 dark:hover:shadow-[#e84855]/40 whitespace-nowrap font-semibold overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1s_forwards]" />
          <Plus size={20} className="relative z-10 transition-transform group-hover:rotate-90 duration-300" />
          <span className="hidden sm:inline relative z-10">Record QC Result</span>
          <span className="sm:hidden relative z-10">New Test</span>
        </button>
      </div>

      {/* Decorative line */}
      <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mb-8 opacity-70" />

      {/* Filters Section */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={selectedMachineId || ''}
            onChange={(e) => onMachineSelect(e.target.value || undefined)}
            className="glass-input w-full px-4 py-3.5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 dark:focus:ring-[#e84855]/50 focus:border-[#c41e3a] dark:focus:border-[#e84855] appearance-none cursor-pointer shadow-sm"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="" disabled>Select a Machine</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id} className="bg-white dark:bg-[#1a1a1a]">
                {m.name} ({m.model})
              </option>
            ))}
          </select>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#c41e3a] dark:group-focus-within:text-[#e84855] transition-colors duration-300" size={20} />
            <input
              type="text"
              placeholder="Search by machine or test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!selectedMachineId}
              className="glass-input w-full pl-12 pr-4 py-3.5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 dark:focus:ring-[#e84855]/50 focus:border-[#c41e3a] dark:focus:border-[#e84855] placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm disabled:opacity-50"
            />
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="glass-input w-full px-4 py-3.5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 dark:focus:ring-[#e84855]/50 focus:border-[#c41e3a] dark:focus:border-[#e84855] appearance-none cursor-pointer shadow-sm"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="all">All Days</option>
            {days.map((day) => (
              <option key={day} value={day} className="bg-white dark:bg-[#1a1a1a]">{day}</option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input w-full px-4 py-3.5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 dark:focus:ring-[#e84855]/50 focus:border-[#c41e3a] dark:focus:border-[#e84855] appearance-none cursor-pointer shadow-sm"
             style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="all">All Months</option>
            {months.map((month) => (
              <option key={month.value} value={month.value} className="bg-white dark:bg-[#1a1a1a]">{month.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="glass-input w-full px-4 py-3.5 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/50 dark:focus:ring-[#e84855]/50 focus:border-[#c41e3a] dark:focus:border-[#e84855] appearance-none cursor-pointer shadow-sm"
             style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="all">All Years</option>
            {years.map((year) => (
              <option key={year} value={year.toString()} className="bg-white dark:bg-[#1a1a1a]">{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        {/* QC History */}
        <QCHistory
          searchTerm={debouncedSearchTerm}
          selectedDay={selectedDay}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          qcHistory={qcHistory}
          machines={machines}
          categories={categories}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>

      {/* Create QC Test Modal */}
      {showCreateForm && (
        <RecordQcResult
          onClose={() => setShowCreateForm(false)}
          machines={machines}
          categories={categories}
        />
      )}
    </>
  );
}
