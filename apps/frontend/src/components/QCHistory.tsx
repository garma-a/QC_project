"use client";

import { useState } from 'react';
import { CheckCircle, AlertCircle, Calendar, User, TrendingUp, ChevronDown, ChevronUp, AlertTriangle, XCircle } from 'lucide-react';
import { applyWestgardRules } from '../utils/westgardRules';

type MachineType = { id: string; name: string; category: string; model?: string };
type CategoryType = { id: string; name: string };
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
  qcHistory: QcHistoryType[];
  machines: MachineType[];
  categories: CategoryType[];
}

export function QCHistory({ searchTerm, qcHistory, machines, categories }: QCHistoryProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  
  const filteredHistory = qcHistory.filter(qc => {
    const machine = machines.find(m => m.id === qc.machineId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      qc.testName.toLowerCase().includes(searchLower) ||
      qc.date.toLowerCase().includes(searchLower) ||
      qc.performedBy.toLowerCase().includes(searchLower) ||
      machine?.name.toLowerCase().includes(searchLower)
    );
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
    // Get last 7 days of data for this test
    const sortedTests = group.tests
      .filter((t: QcHistoryType) => t.numericResult !== undefined)
      .sort((a: QcHistoryType, b: QcHistoryType) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
    
    const dataPoints = sortedTests.map((t: QcHistoryType) => ({
      date: t.date,
      value: t.numericResult || 0,
      testName: t.testName,
    }));

    const analysis = applyWestgardRules(dataPoints);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Westgard Analysis Summary */}
      {testGroupsWithAnalysis.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#b8860b]/10 dark:bg-[#ffd700]/20 rounded-lg">
              <TrendingUp className="text-[#b8860b] dark:text-[#ffd700]" size={20} />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold">Westgard QC Analysis (Last 7 Days)</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Statistical control and rule violations</p>
            </div>
          </div>

          <div className="space-y-3">
            {testGroupsWithAnalysis.map((group: TestGroupAnalysis) => {
              const machine = machines.find((m: MachineType) => m.id === group.machineId);
              const hasRejects = group.analysis.violations.some(v => v.severity === 'reject');
              const hasWarnings = group.analysis.violations.some(v => v.severity === 'warning');
              const isExpanded = expandedTest === group.key;

              return (
                <div 
                  key={group.key}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    hasRejects 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : hasWarnings
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  }`}
                >
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpand(group.key)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {hasRejects ? (
                        <XCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      ) : hasWarnings ? (
                        <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{group.testName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{machine?.name}</p>
                        
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <div className="px-2 py-1 bg-white dark:bg-[#1e1e1e] rounded">
                            <span className="text-gray-600 dark:text-gray-400">Mean: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {group.analysis.stats.mean.toFixed(2)}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-white dark:bg-[#1e1e1e] rounded">
                            <span className="text-gray-600 dark:text-gray-400">SD: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {group.analysis.stats.stdDev.toFixed(2)}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-white dark:bg-[#1e1e1e] rounded">
                            <span className="text-gray-600 dark:text-gray-400">Points: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {group.analysis.pointsWithStatus.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors">
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700 space-y-3">
                      {/* Control Limits */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-white dark:bg-[#1e1e1e] p-2 rounded text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">+3 SD</p>
                          <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                            {group.analysis.stats.plus3s.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] p-2 rounded text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">+2 SD</p>
                          <p className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
                            {group.analysis.stats.plus2s.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] p-2 rounded text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">-2 SD</p>
                          <p className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">
                            {group.analysis.stats.minus2s.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] p-2 rounded text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">-3 SD</p>
                          <p className="font-bold text-red-600 dark:text-red-400 text-sm">
                            {group.analysis.stats.minus3s.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Violations */}
                      {group.analysis.violations.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-semibold text-gray-900 dark:text-white text-sm">Rule Violations:</h5>
                          {group.analysis.violations.map((violation, idx: number) => (
                            <div 
                              key={idx}
                              className="p-3 bg-white dark:bg-[#1e1e1e] rounded-lg"
                            >
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                {violation.rule} - {violation.description}
                              </p>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                                {violation.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Last 7 Days Data */}
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Last 7 Days:</h5>
                        <div className="space-y-1">
                          {group.analysis.pointsWithStatus.map((point, idx: number) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-2 bg-white dark:bg-[#1e1e1e] rounded"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`w-3 h-3 rounded-full ${
                                    point.status === 'reject'
                                      ? 'bg-[#c41e3a] dark:bg-[#e84855]'
                                      : point.status === 'warning'
                                      ? 'bg-[#b8860b] dark:bg-[#ffd700]'
                                      : 'bg-[#22c55e] dark:bg-[#4ade80]'
                                  }`}
                                />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {point.date.split(' ')[0]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                  {point.value.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Z: {point.zScore.toFixed(2)}
                                </span>
                                {point.status !== 'normal' && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    point.status === 'reject' 
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical QC Tests by Date */}
      {Object.entries(groupedByDate).map(([date, tests]: [string, QcHistoryType[]]) => (
        <div key={date} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-5 sm:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-[#c41e3a]/10 dark:border-[#e84855]/20">
            <Calendar size={20} className="text-[#c41e3a] dark:text-[#e84855] flex-shrink-0" />
            <h3 className="text-gray-900 dark:text-white font-bold">{date}</h3>
            <span className="ml-auto px-3 py-1 rounded-lg bg-[#b8860b]/10 dark:bg-[#ffd700]/20 text-[#b8860b] dark:text-[#ffd700] text-sm font-semibold">
              {tests.length} {tests.length === 1 ? 'test' : 'tests'}
            </span>
          </div>

          <div className="space-y-3">
            {tests.map((qc: QcHistoryType) => {
              const machine = machines.find((m: MachineType) => m.id === qc.machineId);
              const category = categories.find((c: CategoryType) => c.id === machine?.category);
              
              return (
                <div key={qc.id} className="p-4 bg-[#fff8f0] dark:bg-[#2a2a2a] rounded-xl hover:bg-[#fef3e2] dark:hover:bg-[#333333] transition-colors border border-[#c41e3a]/10 dark:border-[#e84855]/20">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        {qc.status === 'pass' ? (
                          <div className="p-1.5 bg-[#10b981]/10 dark:bg-[#10b981]/20 rounded-lg flex-shrink-0">
                            <CheckCircle className="text-[#10b981]" size={18} />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-[#c41e3a]/10 dark:bg-[#e84855]/20 rounded-lg flex-shrink-0">
                            <AlertCircle className="text-[#c41e3a] dark:text-[#e84855]" size={18} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-gray-900 dark:text-white font-semibold break-words mb-1">{qc.testName}</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm break-words">{machine?.name} • {category?.name}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pl-10">
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 rounded-lg border border-[#c41e3a]/10 dark:border-[#e84855]/20">
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Result</p>
                          <p className="text-gray-900 dark:text-white font-semibold break-words">{qc.result}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 rounded-lg border border-[#c41e3a]/10 dark:border-[#e84855]/20">
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Expected Range</p>
                          <p className="text-gray-900 dark:text-white font-semibold break-words">{qc.expectedRange}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1e1e1e] p-3 rounded-lg border border-[#c41e3a]/10 dark:border-[#e84855]/20">
                          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Time</p>
                          <p className="text-gray-900 dark:text-white font-semibold">{qc.date.split(' ')[1]}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e1e1e] rounded-lg border border-[#c41e3a]/10 dark:border-[#e84855]/20 text-gray-600 dark:text-gray-400 text-sm pl-10 lg:pl-3 lg:ml-4 flex-shrink-0">
                      <User size={16} className="flex-shrink-0 text-[#b8860b] dark:text-[#ffd700]" />
                      <span className="break-words font-medium">{qc.performedBy}</span>
                    </div>
                  </div>

                  {qc.notes && (
                    <div className="mt-3 pt-3 border-t border-[#c41e3a]/10 dark:border-[#e84855]/20 pl-10">
                      <p className="text-gray-600 dark:text-gray-400 text-sm break-words italic">{qc.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredHistory.length === 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 p-12 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c41e3a]/10 dark:bg-[#e84855]/20 mb-4">
            <AlertCircle className="text-[#c41e3a] dark:text-[#e84855]" size={32} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No QC tests found matching your search</p>
        </div>
      )}
    </div>
  );
}
