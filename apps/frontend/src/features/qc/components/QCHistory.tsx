"use client";

import { useEffect, useState, useTransition } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateQcResult } from '@/lib/actions';

type MachineType = { id: string; name: string; category: string; model?: string };
type CategoryType = { id: string; name: string };
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

type TestGroupAnalysis = {
  key: string;
  machineId: string;
  testName: string;
  tests: QcHistoryType[];
  analysis: {
    violations: { severity: string; rule: string; description: string; message: string }[];
    stats: {
      mean: number; stdDev: number;
      plus3s: number; plus2s: number; minus2s: number; minus3s: number;
    };
    pointsWithStatus: {
      status: string; date: string; value: number; zScore: number; violations: string[];
    }[];
  };
  last7Days: QcHistoryType[];
};

interface QCHistoryProps {
  searchTerm: string;
  selectedDay: string;
  selectedMonth: string;
  selectedYear: string;
  qcHistory: QcHistoryType[];
  machines: MachineType[];
  categories: CategoryType[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function QCHistory({ searchTerm, selectedDay, selectedMonth, selectedYear, qcHistory, machines, categories, fetchNextPage, hasNextPage, isFetchingNextPage }: QCHistoryProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSavingNote, startNoteTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setLocalNotes(
      qcHistory.reduce((acc, qc) => {
        acc[qc.id] = qc.notes ?? null;
        return acc;
      }, {} as Record<string, string | null>)
    );
  }, [qcHistory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && fetchNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    const target = document.getElementById('infinite-scroll-trigger');
    if (target) observer.observe(target);
    
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredHistory = qcHistory.filter(qc => {
    const machine = machines.find(m => m.id === qc.machineId);
    const searchLower = searchTerm.toLowerCase();
    const parsedDate = new Date(qc.rawDate);

    const matchesDay =
      selectedDay === 'all' ||
      (!Number.isNaN(parsedDate.getTime()) && parsedDate.getDate().toString() === selectedDay);

    const matchesMonth =
      selectedMonth === 'all' ||
      (!Number.isNaN(parsedDate.getTime()) && (parsedDate.getMonth() + 1).toString() === selectedMonth);

    const matchesYear =
      selectedYear === 'all' ||
      (!Number.isNaN(parsedDate.getTime()) && parsedDate.getFullYear().toString() === selectedYear);

    const matchesSearch =
      qc.testName.toLowerCase().includes(searchLower) ||
      qc.date.toLowerCase().includes(searchLower) ||
      qc.performedBy.toLowerCase().includes(searchLower) ||
      machine?.name.toLowerCase().includes(searchLower);

    return matchesDay && matchesMonth && matchesYear && Boolean(matchesSearch);
  });

  // Group by test name for Westgard analysis
  const testGroups = filteredHistory.reduce((acc, qc) => {
    const key = `${qc.machineId}-${qc.testName}`;
    if (!acc[key]) {
      acc[key] = {
        machineId: qc.machineId,
        testName: qc.testName,
        tests: [],
      };
    }
    acc[key].tests.push(qc);
    return acc;
  }, {} as Record<string, { machineId: string; testName: string; tests: typeof qcHistory }>);

  // Apply Westgard analysis to each test group
  const testGroupsWithAnalysis = Object.entries(testGroups).map(([key, group]: [string, { machineId: string; testName: string; tests: QcHistoryType[] }]) => {
    // Get most recent points for this test
    const sortedTests = group.tests
      .filter((t: QcHistoryType) => t.numericResult !== undefined)
      .sort((a: QcHistoryType, b: QcHistoryType) => {
        const aTime = Date.parse(a.date);
        const bTime = Date.parse(b.date);

        if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
          return aTime - bTime;
        }

        return a.date.localeCompare(b.date);
      })
      .slice(-7);
    
    const firstTest = sortedTests[0];
    const mean = firstTest?.lotMean ?? 0;
    const stdDev = firstTest?.lotSd ?? 1;

    // Build the analysis object directly from our backend data
    const analysis = {
      violations: sortedTests
        .filter(t => t.violatedRule)
        .map(t => ({
          severity: t.status === 'FAIL' ? 'reject' : 'warning',
          rule: t.violatedRule!,
          description: `${t.violatedRule} Violation`,
          message: `Violated on ${t.date}`,
        })),
      stats: {
        mean,
        stdDev,
        plus3s: mean + 3 * stdDev,
        plus2s: mean + 2 * stdDev,
        minus2s: mean - 2 * stdDev,
        minus3s: mean - 3 * stdDev,
      },
      pointsWithStatus: sortedTests.map((t) => {
        const status =
          t.status === 'FAIL' ? 'reject' : t.status === 'WARNING' ? 'warning' : 'normal';

        return {
          status,
          date: t.date.split(' ')[0] || t.date,
          value: t.numericResult || 0,
          zScore: t.zScore,
          violations: t.violatedRule ? [t.violatedRule] : [],
        };
      }),
    };

    return {
      key,
      machineId: group.machineId,
      testName: group.testName,
      tests: group.tests,
      analysis,
      last7Days: sortedTests,
    };
  });

  // Group by date for display
  const groupedByDate = filteredHistory.reduce((acc, qc) => {
    const date = qc.date.split(' ')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(qc);
    return acc;
  }, {} as Record<string, typeof qcHistory>);

  const toggleExpand = (testKey: string) => {
    setExpandedTest(expandedTest === testKey ? null : testKey);
  };

  const startEditingNote = (qc: QcHistoryType) => {
    setEditingNoteId(qc.id);
    setDraftNote(localNotes[qc.id] ?? '');
    setNoteError(null);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setDraftNote('');
    setNoteError(null);
  };

  const saveNote = (qcId: string) => {
    setNoteError(null);

    startNoteTransition(async () => {
      const result = await updateQcResult(Number(qcId), { comments: draftNote });
      if (result?.error) {
        setNoteError(result.error);
        return;
      }

      setLocalNotes((current) => ({
        ...current,
        [qcId]: draftNote,
      }));
      cancelEditingNote();
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Westgard Analysis Summary */}
      {testGroupsWithAnalysis.length > 0 && (
        <div className="glass-card rounded-3xl border border-[#c41e3a]/10 dark:border-[#e84855]/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#c41e3a]/5 to-transparent dark:from-[#e84855]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-3 bg-gradient-to-br from-[#b8860b]/10 to-[#ffd700]/20 dark:from-[#ffd700]/10 dark:to-[#ffd700]/30 rounded-2xl ring-1 ring-[#b8860b]/30">
              <TrendingUp className="text-[#b8860b] dark:text-[#ffd700]" size={24} />
            </div>
            <div>
              <h3 className="text-xl text-gray-900 dark:text-white font-extrabold tracking-tight">Westgard QC Analysis</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Statistical control and rule violations over the last 7 days</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {testGroupsWithAnalysis.map((group: TestGroupAnalysis) => {
              const machine = machines.find((m: MachineType) => m.id === group.machineId);
              const hasRejects = group.analysis.violations.some(v => v.severity === 'reject');
              const hasWarnings = group.analysis.violations.some(v => v.severity === 'warning');
              const isExpanded = expandedTest === group.key;

              return (
                <div
                  key={group.key}
                  className={`p-1 rounded-2xl transition-all duration-500 ${hasRejects
                      ? 'bg-gradient-to-r from-red-500/10 to-transparent'
                      : hasWarnings
                        ? 'bg-gradient-to-r from-yellow-500/10 to-transparent'
                        : 'bg-gradient-to-r from-green-500/10 to-transparent'
                    }`}
                >
                  <div className={`glass p-5 rounded-xl border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 ${hasRejects ? 'ring-1 ring-red-500/50' : hasWarnings ? 'ring-1 ring-yellow-500/50' : 'ring-1 ring-green-500/30'}`}>
                    <div
                      className="flex items-start justify-between cursor-pointer group/item"
                      onClick={() => toggleExpand(group.key)}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover/item:scale-110 ${hasRejects ? 'bg-red-100 dark:bg-red-900/30' : hasWarnings ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                          {hasRejects ? (
                            <XCircle size={24} className="text-red-600 dark:text-red-400" />
                          ) : hasWarnings ? (
                            <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">{group.testName}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{machine?.name}</p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <div className="px-3 py-1.5 glass rounded-lg border border-white/20">
                              <span className="text-gray-500 dark:text-gray-400">Mean: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {group.analysis.stats.mean.toFixed(2)}
                              </span>
                            </div>
                            <div className="px-3 py-1.5 glass rounded-lg border border-white/20">
                              <span className="text-gray-500 dark:text-gray-400">SD: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {group.analysis.stats.stdDev.toFixed(2)}
                              </span>
                            </div>
                            <div className="px-3 py-1.5 glass rounded-lg border border-white/20">
                              <span className="text-gray-500 dark:text-gray-400">Points: </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {group.analysis.pointsWithStatus.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <ChevronDown size={20} className={`text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expanded Details */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-700/50' : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0'}`}>
                      <div className="overflow-hidden space-y-5">
                        {/* Control Limits */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="glass p-3 rounded-xl border border-red-500/20 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">+3 SD</p>
                            <p className="font-black text-red-600 dark:text-red-400">
                              {group.analysis.stats.plus3s.toFixed(2)}
                            </p>
                          </div>
                          <div className="glass p-3 rounded-xl border border-yellow-500/20 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">+2 SD</p>
                            <p className="font-black text-yellow-600 dark:text-yellow-400">
                              {group.analysis.stats.plus2s.toFixed(2)}
                            </p>
                          </div>
                          <div className="glass p-3 rounded-xl border border-yellow-500/20 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">-2 SD</p>
                            <p className="font-black text-yellow-600 dark:text-yellow-400">
                              {group.analysis.stats.minus2s.toFixed(2)}
                            </p>
                          </div>
                          <div className="glass p-3 rounded-xl border border-red-500/20 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">-3 SD</p>
                            <p className="font-black text-red-600 dark:text-red-400">
                              {group.analysis.stats.minus3s.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Violations */}
                        {group.analysis.violations.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider text-red-500">Rule Violations</h5>
                            <div className="grid gap-2">
                              {group.analysis.violations.map((violation, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl"
                                >
                                  <p className="font-bold text-sm text-red-700 dark:text-red-400">
                                    {violation.rule} - {violation.description}
                                  </p>
                                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 font-medium">
                                    {violation.message}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Last 7 Days Data */}
                        <div>
                          <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Last 7 Days Sequence</h5>
                          <div className="space-y-2">
                            {group.analysis.pointsWithStatus.map((point, idx: number) => (
                              <div
                                key={idx}
                                className="flex flex-wrap items-center justify-between p-3 glass border border-white/20 dark:border-white/5 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full shadow-sm ${point.status === 'reject'
                                        ? 'bg-[#c41e3a] dark:bg-[#e84855] shadow-red-500/50'
                                        : point.status === 'warning'
                                          ? 'bg-[#b8860b] dark:bg-[#ffd700] shadow-yellow-500/50'
                                          : 'bg-[#22c55e] dark:bg-[#4ade80] shadow-green-500/50'
                                      }`}
                                  />
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {point.date}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="font-bold text-sm text-gray-900 dark:text-white w-12 text-right">
                                    {point.value.toFixed(2)}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 w-16 text-right">
                                    Z: {point.zScore.toFixed(2)}
                                  </span>
                                  {point.status !== 'normal' && (
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${
                                      point.status === 'reject'
                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                        : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                      }`}>
                                      {point.violations.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical QC Tests by Date */}
      {Object.entries(groupedByDate).map(([date, tests]: [string, QcHistoryType[]], index) => (
        <div key={date} className="glass-card rounded-3xl p-6 sm:p-8 shadow-xl animate-slide-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-inner">
              <Calendar size={20} className="text-gray-700 dark:text-gray-300" />
            </div>
            <h3 className="text-xl text-gray-900 dark:text-white font-bold">{date}</h3>
            <span className="ml-auto px-3 py-1.5 rounded-lg glass border border-white/20 text-[#c41e3a] dark:text-[#e84855] text-xs font-black uppercase tracking-wider">
              {tests.length} {tests.length === 1 ? 'test' : 'tests'}
            </span>
          </div>

          <div className="space-y-4">
            {tests.map((qc: QcHistoryType) => {
              const machine = machines.find((m: MachineType) => m.id === qc.machineId);
              const category = categories.find((c: CategoryType) => c.id === machine?.category);

              return (
                <div key={qc.id} className="group/card p-5 glass border border-white/30 dark:border-white/5 rounded-2xl hover:shadow-lg hover:border-[#c41e3a]/30 dark:hover:border-[#e84855]/30 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4 mb-4">
                        {qc.status === 'PASS' ? (
                          <div className="p-2 bg-green-100/50 dark:bg-green-900/20 rounded-xl flex-shrink-0 shadow-sm border border-green-200 dark:border-green-800/50">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-100/50 dark:bg-red-900/20 rounded-xl flex-shrink-0 shadow-sm border border-red-200 dark:border-red-800/50">
                            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg text-gray-900 dark:text-white font-bold break-words mb-1 group-hover/card:text-[#c41e3a] dark:group-hover/card:text-[#e84855] transition-colors">{qc.testName}</h4>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium break-words">{machine?.name} • {category?.name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 lg:pl-12">
                        <div className="glass p-3 rounded-xl border border-[#c41e3a]/10 dark:border-[#e84855]/20 group-hover/card:border-[#c41e3a]/30 dark:group-hover/card:border-[#e84855]/30 transition-colors">
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wider">Result</p>
                          <p className="text-gray-900 dark:text-white font-bold break-words text-lg">{qc.result}</p>
                        </div>
                        <div className="glass p-3 rounded-xl border border-[#c41e3a]/10 dark:border-[#e84855]/20 group-hover/card:border-[#c41e3a]/30 dark:group-hover/card:border-[#e84855]/30 transition-colors">
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wider">Expected</p>
                          <p className="text-gray-900 dark:text-white font-medium break-words">{qc.expectedRange}</p>
                        </div>
                        <div className="glass p-3 rounded-xl border border-[#c41e3a]/10 dark:border-[#e84855]/20 group-hover/card:border-[#c41e3a]/30 dark:group-hover/card:border-[#e84855]/30 transition-colors">
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-semibold uppercase tracking-wider">Z-Score</p>
                          <p className={`font-bold break-words text-lg ${
                            qc.zScore !== undefined && Math.abs(qc.zScore) > 2
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {qc.zScore?.toFixed(2) ?? 'N/A'}
                          </p>
                        </div>
                      </div>

                      {qc.violatedRule && (
                        <div className="mt-4 lg:pl-12">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold border border-red-200 dark:border-red-800/50">
                            <AlertTriangle size={14} />
                            Rule Violated: {qc.violatedRule}
                          </div>
                        </div>
                      )}

                      {qc.notes && (
                        <div className="mt-4 lg:pl-12">
                          <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 italic shadow-inner">
                            {qc.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 pt-4 lg:pt-0 border-t border-gray-200/50 dark:border-gray-700/50 lg:border-t-0 mt-4 lg:mt-0 lg:pl-4">
                      <div className="flex flex-col gap-2 items-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-lg shadow-sm">
                          {new Date(qc.rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-black/10 border border-gray-200/50 dark:border-gray-800/50 rounded-lg shadow-sm">
                          <User size={14} className="text-[#b8860b] dark:text-[#ffd700]" />
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-bold truncate max-w-[120px]" title={qc.performedBy}>{qc.performedBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Area (if not already displayed as read-only above) */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 lg:pl-12">
                    {editingNoteId === qc.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          placeholder="Add a note about this QC result"
                          className="min-h-24 glass-input bg-white/50 dark:bg-black/20 rounded-xl focus:ring-2 focus:ring-[#c41e3a]/50 dark:focus:ring-[#e84855]/50 border-none shadow-inner"
                        />
                        {noteError && <p className="text-sm text-red-500 font-semibold">{noteError}</p>}
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEditingNote}
                            disabled={isSavingNote}
                            className="rounded-lg border-gray-200 dark:border-gray-700"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveNote(qc.id)}
                            disabled={isSavingNote}
                            className="rounded-lg bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] hover:opacity-90 shadow-lg text-white"
                          >
                            {isSavingNote ? 'Saving...' : 'Save Note'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {localNotes[qc.id] ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm italic opacity-80 line-clamp-1">
                              Note attached (edit to view)
                            </p>
                          ) : (
                            <p className="text-gray-400 dark:text-gray-500 text-sm">No notes attached.</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 hover:bg-[#c41e3a]/10 dark:hover:bg-[#e84855]/10 text-[#c41e3a] dark:text-[#e84855] rounded-lg"
                          onClick={() => startEditingNote(qc)}
                        >
                          {localNotes[qc.id] ? (
                            <>
                              <Edit2 size={16} className="mr-2" />
                              Edit Note
                            </>
                          ) : (
                            'Add Note'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredHistory.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center shadow-lg relative overflow-hidden animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent dark:from-gray-800/50" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#c41e3a]/10 to-[#b8860b]/10 dark:from-[#e84855]/20 dark:to-[#ffd700]/20 mb-6 ring-2 ring-[#c41e3a]/10 dark:ring-[#e84855]/10 shadow-inner">
              <AlertCircle className="text-[#c41e3a] dark:text-[#e84855]" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">No Results Found</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Try adjusting your filters or search term to find QC history.</p>
          </div>
        </div>
      )}

      {/* Infinite Scroll trigger */}
      {hasNextPage && (
        <div id="infinite-scroll-trigger" className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#c41e3a] dark:border-[#e84855] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading more results...</p>
            </div>
          ) : (
            <div className="h-8"></div>
          )}
        </div>
      )}
    </div>
  );
}
