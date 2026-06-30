"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, RefreshCw, BarChart3, Activity } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useMachines } from "@/hooks/useMachines";
import type { AlertPriority, UserAlertStatus, SectionResponseDto } from "@/lib/types/api";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "@/lib/api/clientFetch";
import { useAuthStore } from "@/store/useAuthStore";

const PRIORITY_STYLES: Record<AlertPriority, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  MEDIUM:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  LOW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const STATUS_STYLES: Record<UserAlertStatus, string> = {
  UNSEEN:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  SEEN:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  RESOLVED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
};

function formatRelativeTime(dateString?: string | Date | null) {
  if (!dateString) return "Unknown time";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function AlertsPage() {
  const [scope, setScope] = useState<"assigned" | "all">("assigned");
  const [sectionFilter, setSectionFilter] = useState<number | null>(null);
  const [machineFilter, setMachineFilter] = useState<number | null>(null);

  const { alerts, loading, error, refetch, markSeen, markResolved, fetchNextPage, hasNextPage, isFetchingNextPage } = useAlerts({ pollIntervalMs: 15000, scope, sectionId: sectionFilter, machineId: machineFilter });
  const { machines } = useMachines();
  const token = useAuthStore((s) => s.accessToken);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: ({ signal }) => clientFetch<SectionResponseDto[]>('/api/v1/sections', { signal }, token),
    enabled: !!token,
  });

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteByAlertId, setNoteByAlertId] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNRESOLVED" | "RESOLVED">("UNRESOLVED");
  const [timeFilter, setTimeFilter] = useState<"24H" | "48H" | "7D" | "ALL">("24H");

  // Filter machines based on selected section
  const availableMachines = useMemo(() => {
    if (!sectionFilter) return machines;
    return machines.filter((m) => m.sectionId === sectionFilter);
  }, [machines, sectionFilter]);

  // Reset machine filter if section changes and the machine is not in the new section
  useMemo(() => {
    if (machineFilter && sectionFilter) {
      const machineExists = availableMachines.some((m) => m.id === machineFilter);
      if (!machineExists) setMachineFilter(null);
    }
  }, [sectionFilter, machineFilter, availableMachines]);

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;

    if (timeFilter === "24H") cutoff = now - 24 * 60 * 60 * 1000;
    if (timeFilter === "48H") cutoff = now - 48 * 60 * 60 * 1000;
    if (timeFilter === "7D") cutoff = now - 7 * 24 * 60 * 60 * 1000;

    return sortedAlerts.filter((alert) => {
      if (statusFilter === "UNRESOLVED" && alert.status === "RESOLVED") return false;
      if (statusFilter === "RESOLVED" && alert.status !== "RESOLVED") return false;

      if (timeFilter === "ALL") return true;
      if (!alert.createdAt) return false;

      const createdAt = new Date(alert.createdAt).getTime();
      if (Number.isNaN(createdAt)) return false;
      return createdAt >= cutoff;
    });
  }, [sortedAlerts, statusFilter, timeFilter]);

  const handleMarkSeen = async (alertId: number) => {
    setActionError(null);
    setProcessingId(alertId);
    try {
      await markSeen(alertId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to mark alert as seen");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkResolved = async (alertId: number) => {
    setActionError(null);
    setProcessingId(alertId);
    try {
      const note = noteByAlertId[alertId]?.trim();
      await markResolved(alertId, note ? { resolutionNote: note } : undefined);
      setNoteByAlertId((prev) => ({ ...prev, [alertId]: "" }));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to mark alert as resolved",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alerts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and acknowledge QC alerts assigned to your account.
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:border-[#c41e3a]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-4">
        {/* Scope and Time/Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1 mr-4">
            <button
              onClick={() => setScope("assigned")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                scope === "assigned"
                  ? "bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              My Sections
            </button>
            <button
              onClick={() => setScope("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                scope === "all"
                  ? "bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              All Sections
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | "UNRESOLVED" | "RESOLVED")
            }
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
          >
            <option value="ALL">All statuses</option>
            <option value="UNRESOLVED">Unresolved only</option>
            <option value="RESOLVED">Resolved only</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as "24H" | "48H" | "7D" | "ALL")}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
          >
            <option value="24H">Last 24 hours</option>
            <option value="48H">Last 48 hours</option>
            <option value="7D">Last 7 days</option>
            <option value="ALL">All time</option>
          </select>
        </div>

        {/* Section and Machine Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sectionFilter ?? ""}
            onChange={(e) => setSectionFilter(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
          >
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>

          <select
            value={machineFilter ?? ""}
            onChange={(e) => setMachineFilter(e.target.value ? Number(e.target.value) : null)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232323] px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
            disabled={availableMachines.length === 0}
          >
            <option value="">All Machines</option>
            {availableMachines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#1f1f1f] dark:text-gray-300">
          Loading alerts...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-[#1f1f1f]">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <p className="text-gray-700 dark:text-gray-200">No alerts found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const priority = alert.priority ?? "MEDIUM";
            const busy = processingId === alert.id;
            const status = alert.status;

            return (
              <div
                key={alert.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#1f1f1f]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-[#c41e3a]" />
                      <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                        {alert.type ?? "QC Alert"}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
                      >
                        {priority}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                      {alert.message ?? "No alert details provided."}
                    </p>
                    {alert.ruleViolated && (
                      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Rule Violated:</span>{" "}
                        {alert.ruleViolated}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {alert.sectionName && (
                        <div className="flex items-center gap-1 font-medium bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                          <Activity className="h-3 w-3 text-[#c41e3a]" />
                          <span>{alert.sectionName}</span>
                        </div>
                      )}
                      {alert.machineName && (
                        <div className="flex items-center gap-1 font-medium bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                          <BarChart3 className="h-3 w-3 text-blue-500" />
                          <span>{alert.machineName}</span>
                        </div>
                      )}
                      {alert.testName && (
                        <div className="flex items-center gap-1 font-medium bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                          <span>{alert.testName}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatRelativeTime(alert.createdAt)}
                    </p>
                    {alert.resolutionNote && (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Resolution note: {alert.resolutionNote}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleMarkSeen(alert.id)}
                        disabled={busy || status !== "UNSEEN"}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
                      >
                        <Eye className="h-4 w-4" />
                        Seen
                      </button>
                      
                      {alert.machineId && alert.testId && (
                        <Link
                          href={`/dashboard?machineId=${alert.machineId}&tab=charts&testId=${alert.testId}`}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Go to Graph
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <input
                        value={noteByAlertId[alert.id] ?? ""}
                        onChange={(e) =>
                          setNoteByAlertId((prev) => ({
                            ...prev,
                            [alert.id]: e.target.value,
                          }))
                        }
                        placeholder="Resolution note (optional)"
                        className="w-48 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#232323] px-2 py-2 text-xs text-gray-800 dark:text-gray-100"
                      />
                      <button
                        onClick={() => handleMarkResolved(alert.id)}
                        disabled={busy || status === "RESOLVED"}
                        className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#c41e3a] to-[#8b1e3f] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {hasNextPage && (
            <div
              className="py-4 text-center text-sm text-gray-500"
              ref={(node) => {
                if (!node) return;
                const observer = new IntersectionObserver(
                  (entries) => {
                    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                      fetchNextPage();
                    }
                  },
                  { threshold: 0.1 }
                );
                observer.observe(node);
                return () => observer.disconnect();
              }}
            >
              {isFetchingNextPage ? 'Loading more alerts...' : 'Scroll for more'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
