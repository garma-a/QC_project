"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
  ChevronDown,
} from "lucide-react";
import { allErrors, MachineError } from "../data/mockData";
import { ErrorDetailPanel } from "./ErrorDetailPanel";

type FilterPeriod = "24h" | "48h" | "1week" | "all";

export function GeneralErrors() {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("24h");
  const [selectedError, setSelectedError] = useState<MachineError | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "warning" | "info"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "resolved"
  >("active");

  // Filter errors based on time period
  const filteredByTime = useMemo(() => {
    const now = new Date("2025-09-17T15:30:00");
    const cutoffTime = new Date(now);

    switch (filterPeriod) {
      case "24h":
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        break;
      case "48h":
        cutoffTime.setHours(cutoffTime.getHours() - 48);
        break;
      case "1week":
        cutoffTime.setDate(cutoffTime.getDate() - 7);
        break;
      case "all":
        cutoffTime.setFullYear(cutoffTime.getFullYear() - 10);
        break;
    }

    return allErrors.filter((error) => new Date(error.timestamp) >= cutoffTime);
  }, [filterPeriod]);

  // Apply additional filters
  const filteredErrors = useMemo(() => {
    return filteredByTime.filter((error) => {
      const matchesSeverity =
        severityFilter === "all" || error.severity === severityFilter;
      const matchesStatus =
        statusFilter === "all" || error.status === statusFilter;
      return matchesSeverity && matchesStatus;
    });
  }, [filteredByTime, severityFilter, statusFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700";
      case "info":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "chemistry":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "hematology":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "immunology":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date("2025-09-17T15:30:00");
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-899 dark:text-white">
            General Errors
          </h1>
          <div className="flex-1" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor all machine errors across your laboratory
        </p>
        <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mt-4" />
      </div>

      {/* Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {(["24h", "48h", "1week", "all"] as FilterPeriod[]).map(
              (period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterPeriod === period
                      ? "bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] dark:from-[#e84855] dark:to-[#c75b7a] text-white shadow-lg"
                      : "bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#c41e3a] dark:hover:border-[#e84855]"
                  }`}
                >
                  {period === "24h" && "Last 24 Hours"}
                  {period === "48h" && "Last 48 Hours"}
                  {period === "1week" && "Last 7 Days"}
                  {period === "all" && "All Time"}
                </button>
              )
            )}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-[#c41e3a] dark:text-[#e84855] hover:underline font-medium"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
          Advanced Filters
        </button>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity
                </label>
                <div className="space-y-2">
                  {(["all", "critical", "warning", "info"] as const).map(
                    (sev) => (
                      <label
                        key={sev}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={sev}
                          checked={severityFilter === sev}
                          onChange={(e) =>
                            setSeverityFilter(e.target.value as any)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {sev === "all" ? "All Severities" : sev}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {(["all", "active", "resolved"] as const).map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={statusFilter === status}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {status === "all" ? "All Statuses" : status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredErrors.length} error
        {filteredErrors.length !== 1 ? "s" : ""} in selected period
      </div>

      {/* Errors List */}
      <div className="space-y-4">
        {filteredErrors.length === 0 ? (
          <div className="bg-white dark:bg-[#2a2a2a] rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Errors Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All systems operating normally in the selected period.
            </p>
          </div>
        ) : (
          filteredErrors.map((error) => (
            <button
              key={error.id}
              onClick={() => setSelectedError(error)}
              className="w-full bg-white dark:bg-[#2a2a2a] rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all text-left hover:border-[#c41e3a] dark:hover:border-[#e84855]"
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(
                    error.severity
                  )}`}
                >
                  {getSeverityIcon(error.severity)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {error.errorType}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 border ${getSeverityColor(
                          error.severity
                        )} text-xs font-medium capitalize`}
                      >
                        {error.severity}
                      </span>
                      {error.status === "resolved" && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {error.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Machine Info */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 ${getCategoryColor(
                          error.machineCategory
                        )} text-xs font-medium capitalize`}
                      >
                        {error.machineCategory}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {error.machineName}
                      </span>
                    </div>

                    {/* Related Errors */}
                    {error.relatedErrorCount > 0 && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded">
                        +{error.relatedErrorCount} similar
                      </span>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1 ml-auto text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(error.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-gray-400">
                  <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Error Detail Panel */}
      <ErrorDetailPanel
        error={selectedError}
        onClose={() => setSelectedError(null)}
      />
    </div>
  );
}
