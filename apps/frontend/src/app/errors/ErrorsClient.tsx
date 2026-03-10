"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
  ChevronDown,
} from "lucide-react";
import { ErrorDetailPanel } from "@/components/ErrorDetailPanel";
import type { MachineErrorSchema } from "@/types/schema";

type FilterPeriod = "24h" | "48h" | "1week" | "all";
type SeverityFilter = "all" | "critical" | "warning" | "info";
type StatusFilter = "all" | "active" | "resolved";

type ErrorsClientProps = {
  allErrors: MachineErrorSchema[];
};

interface SeverityOption {
  value: SeverityFilter;
  label: string;
}

interface StatusOption {
  value: StatusFilter;
  label: string;
}

const severityOptions: SeverityOption[] = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "critical" },
  { value: "warning", label: "warning" },
  { value: "info", label: "info" },
];

const statusOptions: StatusOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "active" },
  { value: "resolved", label: "resolved" },
];

const isSeverityFilter = (value: string): value is SeverityFilter => {
  return severityOptions.some((option) => option.value === value);
};

const isStatusFilter = (value: string): value is StatusFilter => {
  return statusOptions.some((option) => option.value === value);
};

const getPeriodButtonClass = (isActive: boolean) => {
  return isActive
    ? "qc-errors-period-button qc-errors-period-button-active"
    : "qc-errors-period-button qc-errors-period-button-inactive";
};

const getSeverityToneClass = (severity: MachineErrorSchema["severity"]) => {
  switch (severity) {
    case "critical":
      return "qc-errors-severity-critical";
    case "warning":
      return "qc-errors-severity-warning";
    case "info":
      return "qc-errors-severity-info";
    default:
      return "qc-errors-severity-default";
  }
};

const getCategoryToneClass = (category: MachineErrorSchema["machineCategory"]) => {
  switch (category) {
    case "chemistry":
      return "qc-errors-category-chemistry";
    case "hematology":
      return "qc-errors-category-hematology";
    case "immunology":
      return "qc-errors-category-immunology";
    default:
      return "qc-errors-category-default";
  }
};

export default function ErrorsClient({ allErrors }: ErrorsClientProps) {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("24h");
  const [selectedError, setSelectedError] = useState<MachineErrorSchema | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

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
  }, [filterPeriod, allErrors]);

  const filteredErrors = useMemo(() => {
    return filteredByTime.filter((error) => {
      const matchesSeverity = severityFilter === "all" || error.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || error.status === statusFilter;
      return matchesSeverity && matchesStatus;
    });
  }, [filteredByTime, severityFilter, statusFilter]);

  const getSeverityIcon = (severity: MachineErrorSchema["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="qc-errors-icon-md" />;
      case "warning":
        return <AlertTriangle className="qc-errors-icon-md" />;
      case "info":
        return <CheckCircle className="qc-errors-icon-md" />;
      default:
        return <AlertCircle className="qc-errors-icon-md" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date("2025-09-17T15:30:00");
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    return `${diffDays}d ago`;
  };

  return (
    <div className="qc-errors-page">
      <div className="qc-errors-header">
        <div className="qc-errors-header-row">
          <h1 className="qc-errors-title">General Errors</h1>
          <div className="qc-errors-header-fill" />
        </div>
        <p className="qc-errors-subtitle">Monitor all machine errors across your laboratory</p>
        <div className="qc-errors-header-accent" />
      </div>

      <div className="qc-errors-filter-section">
        <div className="qc-errors-filter-row">
          <Filter className="qc-errors-filter-icon" />
          <div className="qc-errors-period-list">
            {(["24h", "48h", "1week", "all"] as FilterPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={getPeriodButtonClass(filterPeriod === period)}
              >
                {period === "24h" && "Last 24 Hours"}
                {period === "48h" && "Last 48 Hours"}
                {period === "1week" && "Last 7 Days"}
                {period === "all" && "All Time"}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className="qc-errors-advanced-toggle">
          <ChevronDown
            className={
              showFilters
                ? "qc-errors-advanced-icon qc-errors-advanced-icon-open"
                : "qc-errors-advanced-icon"
            }
          />
          Advanced Filters
        </button>

        {showFilters && (
          <div className="qc-errors-advanced-panel">
            <div className="qc-errors-advanced-grid">
              <div className="qc-errors-filter-group">
                <label className="qc-errors-filter-label">Severity</label>
                <div className="qc-errors-filter-options">
                  {severityOptions.map((option) => (
                    <label key={option.value} className="qc-errors-radio-row">
                      <input
                        type="radio"
                        name="severity"
                        value={option.value}
                        checked={severityFilter === option.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isSeverityFilter(value)) {
                            setSeverityFilter(value);
                          }
                        }}
                        className="qc-errors-radio-input"
                      />
                      <span className="qc-errors-radio-text">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="qc-errors-filter-group">
                <label className="qc-errors-filter-label">Status</label>
                <div className="qc-errors-filter-options">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="qc-errors-radio-row">
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={statusFilter === option.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isStatusFilter(value)) {
                            setStatusFilter(value);
                          }
                        }}
                        className="qc-errors-radio-input"
                      />
                      <span className="qc-errors-radio-text">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="qc-errors-summary">
        Showing {filteredErrors.length} error{filteredErrors.length !== 1 ? "s" : ""} in selected period
      </div>

      <div className="qc-errors-list">
        {filteredErrors.length === 0 ? (
          <div className="qc-errors-empty-card">
            <CheckCircle className="qc-errors-empty-icon" />
            <h3 className="qc-errors-empty-title">No Errors Found</h3>
            <p className="qc-errors-empty-text">All systems operating normally in the selected period.</p>
          </div>
        ) : (
          filteredErrors.map((error) => (
            <button
              key={error.id}
              onClick={() => setSelectedError(error)}
              className="qc-errors-item-button"
            >
              <div className="qc-errors-item-row">
                <div className={`qc-errors-item-icon-wrap ${getSeverityToneClass(error.severity)}`}>
                  {getSeverityIcon(error.severity)}
                </div>

                <div className="qc-errors-item-content">
                  <div className="qc-errors-item-head">
                    <div className="qc-errors-item-meta-row">
                      <h3 className="qc-errors-item-title">{error.errorType}</h3>
                      <span className={`qc-errors-pill-base ${getSeverityToneClass(error.severity)}`}>
                        {error.severity}
                      </span>
                      {error.status === "resolved" && (
                        <span className="qc-errors-status-resolved">Resolved</span>
                      )}
                    </div>
                  </div>

                  <p className="qc-errors-item-description">{error.description}</p>

                  <div className="qc-errors-item-footer">
                    <div className="qc-errors-machine-info">
                      <span className={`qc-errors-pill-base ${getCategoryToneClass(error.machineCategory)}`}>
                        {error.machineCategory}
                      </span>
                      <span className="qc-errors-machine-name">{error.machineName}</span>
                    </div>

                    {error.relatedErrorCount > 0 && (
                      <span className="qc-errors-related-pill">+{error.relatedErrorCount} similar</span>
                    )}

                    <div className="qc-errors-time-row">
                      <Clock className="qc-errors-time-icon" />
                      {formatTimeAgo(error.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="qc-errors-arrow-wrap">
                  <ChevronDown className="qc-errors-chevron" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <ErrorDetailPanel error={selectedError} onClose={() => setSelectedError(null)} />
    </div>
  );
}
