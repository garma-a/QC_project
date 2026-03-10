"use client";

import { useState } from "react";
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
  Plus,
  Search,
} from "lucide-react";
import { applyWestgardRules } from "../utils/westgardRules";
import { CreateQCTest } from "@/components/CreateQCTest";
import { LogoCompact } from "@/components/Logo";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";

interface QCHistoryProps {
  qcHistory: QCTestSchema[];
  machines: MachineSchema[];
  categories: CategorySchema[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function QCHistory({ qcHistory, machines, categories, searchTerm, onSearchTermChange }: QCHistoryProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredHistory = qcHistory.filter((qc) => {
    const machine = machines.find((m) => m.id === qc.machineId);
    const searchLower = searchTerm.toLowerCase();

    return (
      qc.testName.toLowerCase().includes(searchLower) ||
      qc.date.toLowerCase().includes(searchLower) ||
      qc.performedBy.toLowerCase().includes(searchLower) ||
      machine?.name.toLowerCase().includes(searchLower)
    );
  });

  const testGroups = filteredHistory.reduce(
    (acc, qc) => {
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
    },
    {} as Record<string, { machineId: string; testName: string; tests: QCTestSchema[] }>,
  );

  const testGroupsWithAnalysis = Object.entries(testGroups).map(([key, group]) => {
    const sortedTests = group.tests
      .filter((t) => t.numericResult !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);

    const dataPoints = sortedTests.map((t) => ({
      date: t.date,
      value: t.numericResult || 0,
      testName: t.testName,
    }));

    const analysis = applyWestgardRules(dataPoints);

    return {
      key,
      ...group,
      analysis,
      last7Days: sortedTests,
    };
  });

  const groupedByDate = filteredHistory.reduce(
    (acc, qc) => {
      const date = qc.date.split(" ")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(qc);
      return acc;
    },
    {} as Record<string, QCTestSchema[]>,
  );

  const toggleExpand = (testKey: string) => {
    setExpandedTest(expandedTest === testKey ? null : testKey);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center justify-between gap-3">
          <div />
          <div className="lg:hidden">
            <LogoCompact />
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] px-5 py-3 font-semibold text-white ring-2 ring-[#b8860b]/50 shadow-lg shadow-[#c41e3a]/30 transition-all hover:from-[#8b1e3f] hover:to-[#c41e3a] hover:shadow-xl dark:from-[#e84855] dark:to-[#c75b7a] dark:ring-[#ffd700]/50 dark:shadow-[#e84855]/30 dark:hover:from-[#c75b7a] dark:hover:to-[#e84855]"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Create New QC Test</span>
          <span className="sm:hidden">New Test</span>
        </button>
      </div>

      <div className="mb-6 h-1 rounded-full bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2]" />

      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by machine, test name, or date..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full rounded-xl border-2 border-[#c41e3a]/20 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:border-[#e84855]/30 dark:bg-[#1e1e1e] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-[#e84855]"
          />
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {testGroupsWithAnalysis.length > 0 && (
          <div className="group qc-main-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[#b8860b]/10 p-2 dark:bg-[#ffd700]/20">
                <TrendingUp className="text-[#b8860b] dark:text-[#ffd700]" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Westgard QC Analysis (Last 7 Days)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Statistical control and rule violations
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {testGroupsWithAnalysis.map((group) => {
                const machine = machines.find((m) => m.id === group.machineId);
                const hasRejects = group.analysis.violations.some((v) => v.severity === "reject");
                const hasWarnings = group.analysis.violations.some((v) => v.severity === "warning");
                const isExpanded = expandedTest === group.key;

                return (
                  <div
                    key={group.key}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      hasRejects
                        ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                        : hasWarnings
                          ? "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
                          : "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                    }`}
                  >
                    <div
                      className="flex cursor-pointer items-start justify-between"
                      onClick={() => toggleExpand(group.key)}
                    >
                      <div className="flex flex-1 items-start gap-3">
                        {hasRejects ? (
                          <XCircle size={20} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                        ) : hasWarnings ? (
                          <AlertTriangle
                            size={20}
                            className="mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
                          />
                        ) : (
                          <CheckCircle
                            size={20}
                            className="mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{group.testName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{machine?.name}</p>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <div className="rounded bg-white px-2 py-1 dark:bg-[#1e1e1e]">
                              <span className="text-gray-600 dark:text-gray-400">Mean: </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {group.analysis.stats.mean.toFixed(2)}
                              </span>
                            </div>
                            <div className="rounded bg-white px-2 py-1 dark:bg-[#1e1e1e]">
                              <span className="text-gray-600 dark:text-gray-400">SD: </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {group.analysis.stats.stdDev.toFixed(2)}
                              </span>
                            </div>
                            <div className="rounded bg-white px-2 py-1 dark:bg-[#1e1e1e]">
                              <span className="text-gray-600 dark:text-gray-400">Points: </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {group.analysis.pointsWithStatus.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="rounded-lg p-2 transition-colors hover:bg-white/50 dark:hover:bg-black/20">
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t-2 border-gray-200 pt-4 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="rounded bg-white p-2 text-center dark:bg-[#1e1e1e]">
                            <p className="text-xs text-gray-600 dark:text-gray-400">+3 SD</p>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">
                              {group.analysis.stats.plus3s.toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded bg-white p-2 text-center dark:bg-[#1e1e1e]">
                            <p className="text-xs text-gray-600 dark:text-gray-400">+2 SD</p>
                            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                              {group.analysis.stats.plus2s.toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded bg-white p-2 text-center dark:bg-[#1e1e1e]">
                            <p className="text-xs text-gray-600 dark:text-gray-400">-2 SD</p>
                            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                              {group.analysis.stats.minus2s.toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded bg-white p-2 text-center dark:bg-[#1e1e1e]">
                            <p className="text-xs text-gray-600 dark:text-gray-400">-3 SD</p>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">
                              {group.analysis.stats.minus3s.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {group.analysis.violations.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Rule Violations:
                            </h5>
                            {group.analysis.violations.map((violation, idx) => (
                              <div key={idx} className="rounded-lg bg-white p-3 dark:bg-[#1e1e1e]">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {violation.rule} - {violation.description}
                                </p>
                                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                                  {violation.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <h5 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                            Last 7 Days:
                          </h5>
                          <div className="space-y-1">
                            {group.analysis.pointsWithStatus.map((point, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded bg-white p-2 dark:bg-[#1e1e1e]"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 rounded-full ${
                                      point.status === "reject"
                                        ? "bg-[#c41e3a] dark:bg-[#e84855]"
                                        : point.status === "warning"
                                          ? "bg-[#b8860b] dark:bg-[#ffd700]"
                                          : "bg-[#22c55e] dark:bg-[#4ade80]"
                                    }`}
                                  />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {point.date.split(" ")[0]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {point.value.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Z: {point.zScore.toFixed(2)}
                                  </span>
                                  {point.status !== "normal" && (
                                    <span
                                      className={`rounded px-2 py-0.5 text-xs ${
                                        point.status === "reject"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                      }`}
                                    >
                                      {point.violations.join(", ")}
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

        {Object.entries(groupedByDate).map(([date, tests]) => (
          <div key={date} className="group qc-main-card">
            <div className="mb-4 flex items-center gap-3 border-b-2 border-[#c41e3a]/10 pb-3 dark:border-[#e84855]/20">
              <Calendar size={20} className="flex-shrink-0 text-[#c41e3a] dark:text-[#e84855]" />
              <h3 className="font-bold text-gray-900 dark:text-white">{date}</h3>
              <span className="ml-auto rounded-lg bg-[#b8860b]/10 px-3 py-1 text-sm font-semibold text-[#b8860b] dark:bg-[#ffd700]/20 dark:text-[#ffd700]">
                {tests.length} {tests.length === 1 ? "test" : "tests"}
              </span>
            </div>

            <div className="space-y-3">
              {tests.map((qc) => {
                const machine = machines.find((m) => m.id === qc.machineId);
                const category = categories.find((c) => c.id === machine?.category);

                return (
                  <div key={qc.id} className="qc-item-card">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-start gap-3">
                          {qc.status === "pass" ? (
                            <div className="rounded-lg bg-[#10b981]/10 p-1.5 dark:bg-[#10b981]/20">
                              <CheckCircle className="text-[#10b981]" size={18} />
                            </div>
                          ) : (
                            <div className="rounded-lg bg-[#c41e3a]/10 p-1.5 dark:bg-[#e84855]/20">
                              <AlertCircle className="text-[#c41e3a] dark:text-[#e84855]" size={18} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="mb-1 break-words font-semibold text-gray-900 dark:text-white">
                              {qc.testName}
                            </h4>
                            <p className="break-words text-sm text-gray-600 dark:text-gray-400">
                              {machine?.name} • {category?.name}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 pl-10 sm:grid-cols-3">
                          <div className="qc-data-box">
                            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Result</p>
                            <p className="break-words font-semibold text-gray-900 dark:text-white">{qc.result}</p>
                          </div>
                          <div className="qc-data-box">
                            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Expected Range</p>
                            <p className="break-words font-semibold text-gray-900 dark:text-white">
                              {qc.expectedRange}
                            </p>
                          </div>
                          <div className="qc-data-box">
                            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Time</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {qc.date.split(" ")[1]}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="qc-data-box flex flex-shrink-0 items-center gap-2 px-3 py-2 pl-10 text-sm text-gray-600 dark:text-gray-400 lg:ml-4 lg:pl-3">
                        <User size={16} className="flex-shrink-0 text-[#b8860b] dark:text-[#ffd700]" />
                        <span className="break-words font-medium">{qc.performedBy}</span>
                      </div>
                    </div>

                    {qc.notes && (
                      <div className="mt-3 border-t border-[#c41e3a]/10 pt-3 pl-10 dark:border-[#e84855]/20">
                        <p className="break-words text-sm italic text-gray-600 dark:text-gray-400">{qc.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="group qc-main-card p-12 text-center sm:p-12">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#c41e3a]/10 dark:bg-[#e84855]/20">
              <AlertCircle className="text-[#c41e3a] dark:text-[#e84855]" size={32} />
            </div>
            <p className="font-medium text-gray-600 dark:text-gray-400">
              No QC tests found matching your search
            </p>
          </div>
        )}
      </div>

      {showCreateForm && <CreateQCTest onClose={() => setShowCreateForm(false)} />}
    </>
  );
}
