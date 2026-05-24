"use client";

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { CreateQCTest } from '@/features/qc/components/CreateQCTest';
import { QCHistory } from '@/features/qc/components/QCHistory';
import { LogoCompact } from '@/components/layout/Logo';

type QcHistoryType = {
  id: string;
  machineId: string;
  testName: string;
  date: string;
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
  categories 
}: { 
  qcHistory: QcHistoryType[], 
  machines: { id: string; category: string; name: string; model: string }[], 
  categories: { id: string; name: string }[] 
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex items-center gap-3 flex-1 justify-between">
          <div />
          <div className="lg:hidden">
            <LogoCompact />
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white rounded-xl hover:from-[#8b1e3f] hover:to-[#c41e3a] dark:hover:from-[#c75b7a] dark:hover:to-[#e84855] transition-all shadow-lg hover:shadow-xl shadow-[#c41e3a]/30 dark:shadow-[#e84855]/30 whitespace-nowrap font-semibold ring-2 ring-[#b8860b]/50 dark:ring-[#ffd700]/50"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Create New QC Test</span>
          <span className="sm:hidden">New Test</span>
        </button>
      </div>

      {/* Decorative line */}
      <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mb-6" />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={20} />
          <input
            type="text"
            placeholder="Search by machine, test name, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* QC History */}
      <QCHistory 
        searchTerm={searchTerm} 
        qcHistory={qcHistory} 
        machines={machines} 
        categories={categories} 
      />

      {/* Create QC Test Modal */}
      {showCreateForm && (
        <CreateQCTest 
          onClose={() => setShowCreateForm(false)} 
          machines={machines} 
          categories={categories} 
        />
      )}
    </>
  );
}
