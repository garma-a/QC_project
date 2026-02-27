"use client";

import { AlertCircle, AlertTriangle, CheckCircle, X } from "lucide-react";
import { MachineError, machines } from "../data/mockData";

interface ErrorDetailPanelProps {
  error: MachineError | null;
  onClose: () => void;
}

type ErrorSeverity = MachineError["severity"];

export function ErrorDetailPanel({ error, onClose }: ErrorDetailPanelProps) {
  if (!error) return null;

  const machine = machines.find((m) => m.id === error.machineId);
  const hasRange =
    error.lowRange !== undefined && error.highRange !== undefined;

  const getSeverityBgColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/20";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity): JSX.Element => {
    switch (severity) {
      case "critical":
        return (
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        );
      case "warning":
        return (
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        );
      case "info":
        return (
          <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        );
      default:
        return (
          <AlertCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay backdrop (visual only) */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Detail Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 border border-gray-200 dark:border-gray-700"
      >
        {/* Header with close button */}
        <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between z-10">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityBgColor(
                error.severity
              )}`}
            >
              {getSeverityIcon(error.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {error.errorType}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {error.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Severity & Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 ${error.severity === "critical"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : error.severity === "warning"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                } capitalize text-sm`}
            >
              {error.severity}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 ${error.status === "active"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                } capitalize text-sm`}
            >
              {error.status}
            </span>
          </div>

          {/* Error Code and Timestamp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-[#2a2a2a] p-4 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Error Code
              </h4>
              <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                {error.errorCode}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#2a2a2a] p-4 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Occurred
              </h4>
              <p className="text-sm text-gray-900 dark:text-white">
                {new Date(error.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Machine Information */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Machine Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Machine
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {error.machineName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  ID
                </p>
                <p className="font-mono text-sm text-gray-900 dark:text-white">
                  {error.machineId}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Category
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 ${error.machineCategory === "chemistry"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : error.machineCategory === "hematology"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    } capitalize text-xs`}
                >
                  {error.machineCategory}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Model
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {machine?.model || "N/A"}
                </p>
              </div>
            </div>
            {machine && (
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Location
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {machine.location}
                </p>
              </div>
            )}
          </div>

          {/* Test Range & Recent Values */}
          {(hasRange ||
            (error.recentValues && error.recentValues.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasRange && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Expected Range
                    </h4>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {error.lowRange} – {error.highRange} {error.units || ""}
                    </p>
                    {error.primaryTestName && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Test:{" "}
                        <span className="font-semibold">
                          {error.primaryTestName}
                        </span>
                        {error.primaryTestCode
                          ? ` (Code: ${error.primaryTestCode})`
                          : ""}
                      </p>
                    )}
                  </div>
                )}

                {error.recentValues && error.recentValues.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Recent Values (Last 6)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {error.recentValues.map((val: number, idx: number) => {
                        const isOutOfRange =
                          hasRange &&
                          (val < (error.lowRange ?? -Infinity) ||
                            val > (error.highRange ?? Infinity));
                        return (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-xs font-medium ${isOutOfRange
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                              }`}
                          >
                            {val}
                            {error.units ? ` ${error.units}` : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Pattern Classification */}
          {error.errorPattern && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Pattern Analysis
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 ${error.errorPattern === "systematic"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    } capitalize text-sm`}
                >
                  {error.errorPattern} Error
                </span>
                {error.westgardRule && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                    {error.westgardRule}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {error.patternExplanation}
              </p>
            </div>
          )}

          {/* Affected Tests */}
          {error.affectedTests && error.affectedTests.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Affected Tests
              </h4>
              <div className="flex flex-wrap gap-2">
                {error.affectedTests.map((test: string) => (
                  <span
                    key={test}
                    className="inline-flex items-center rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {test}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Possible Causes */}
          <div
            className={`${getSeverityBgColor(
              error.severity
            )} p-4 rounded-lg border-l-4 ${error.severity === "critical"
                ? "border-l-red-600 dark:border-l-red-400"
                : error.severity === "warning"
                  ? "border-l-yellow-600 dark:border-l-yellow-400"
                  : "border-l-blue-600 dark:border-l-blue-400"
              }`}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              ⚠️ Possible Causes
            </h4>
            <ul className="space-y-2">
              {error.possibleCauses.map((cause: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="text-[#c41e3a] dark:text-[#e84855] font-bold flex-shrink-0 text-lg">
                    •
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {cause}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Solutions */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-l-green-600 dark:border-l-green-400">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              ✓ Suggested Solutions
            </h4>
            <ol className="space-y-3">
              {error.suggestedSolutions.map((solution: string, index: number) => (
                <li
                  key={index}
                  className="flex gap-3 text-gray-700 dark:text-gray-300"
                >
                  <span className="bg-green-600 dark:bg-green-500 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    {index + 1}
                  </span>
                  <span>{solution}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* AI Insight */}
          {error.aiInsight && (
            <div className="bg-gradient-to-r from-[#2a2a2a] to-[#2a2a2a] dark:from-[#2a2a2a] dark:to-[#3a3a3a] p-4 rounded-lg border border-[#c41e3a]/30 dark:border-[#e84855]/30">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-lg">🤖</span> AI-Powered Insight
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {error.aiInsight}
              </p>
            </div>
          )}

          {/* Help & Action */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              📚 For persistent issues, consult your equipment&apos;s technical
              documentation or contact your service provider.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] hover:from-[#b01832] hover:to-[#7a1935] text-white text-sm"
              >
                View Machine Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
