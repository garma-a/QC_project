"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, XCircle, AlertTriangle } from "lucide-react";
import { applyWestgardRules } from "@/utils/westgardRules";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";

type DashboardClientProps = {
  machines: MachineSchema[];
  categories: CategorySchema[];
  qcHistory: QCTestSchema[];
};

const getFilterButtonClass = (isActive: boolean) => {
  return isActive
    ? "qc-filter-button-base qc-filter-active"
    : "qc-filter-button-base qc-filter-inactive";
};

const getStatusDotClass = (status: MachineSchema["status"]) => {
  switch (status) {
    case "operational":
      return "qc-machine-status-dot qc-machine-status-dot-operational";
    case "warning":
      return "qc-machine-status-dot qc-machine-status-dot-warning";
    default:
      return "qc-machine-status-dot qc-machine-status-dot-error";
  }
};

const getStatusPingClass = (status: MachineSchema["status"]) => {
  switch (status) {
    case "operational":
      return "qc-machine-status-ping qc-machine-status-ping-operational";
    case "warning":
      return "qc-machine-status-ping qc-machine-status-ping-warning";
    default:
      return "qc-machine-status-ping qc-machine-status-ping-error";
  }
};

const getQcIconClass = (qcStatus: "pass" | "warning" | "error") => {
  switch (qcStatus) {
    case "pass":
      return "qc-icon-pass";
    case "warning":
      return "qc-icon-warning";
    default:
      return "qc-icon-error";
  }
};

const getViolationBadgeClass = (qcStatus: "pass" | "warning" | "error") => {
  return qcStatus === "error"
    ? "qc-violation-badge qc-violation-error"
    : "qc-violation-badge qc-violation-warning";
};

export default function DashboardClient({ machines, categories, qcHistory }: DashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const router = useRouter();

  const machinesWithStatus = machines.map((machine) => {
    const machineQCData = qcHistory
      .filter((qc) => qc.machineId === machine.id && qc.numericResult !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const testGroups: Record<string, typeof machineQCData> = {};
    machineQCData.forEach((qc) => {
      if (!testGroups[qc.testName]) {
        testGroups[qc.testName] = [];
      }
      testGroups[qc.testName].push(qc);
    });

    let hasReject = false;
    let hasWarning = false;
    let violationCount = 0;

    Object.values(testGroups).forEach((tests) => {
      if (tests.length < 2) {
        return;
      }

      const dataPoints = tests.map((t) => ({
        date: t.date,
        value: t.numericResult || 0,
      }));

      const analysis = applyWestgardRules(dataPoints);

      if (analysis.violations.length > 0) {
        violationCount += analysis.violations.length;
        analysis.violations.forEach((v) => {
          if (v.severity === "reject") {
            hasReject = true;
          }
          if (v.severity === "warning") {
            hasWarning = true;
          }
        });
      }
    });

    let qcStatus: "pass" | "warning" | "error" = "pass";
    if (hasReject) {
      qcStatus = "error";
    } else if (hasWarning) {
      qcStatus = "warning";
    }

    return {
      ...machine,
      qcStatus,
      violationCount,
    };
  });

  const filteredMachines =
    selectedCategory === "all"
      ? machinesWithStatus
      : machinesWithStatus.filter((m) => m.category === selectedCategory);

  return (
    <div className="qc-dashboard-page">
      <div className="qc-dashboard-header">
        <div className="qc-dashboard-header-spacer" />
        <div className="qc-header-accent" />
      </div>

      <div className="qc-filter-row">
        <button
          onClick={() => setSelectedCategory("all")}
          className={getFilterButtonClass(selectedCategory === "all")}
        >
          All Machines
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={getFilterButtonClass(selectedCategory === category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="qc-machine-grid">
        {filteredMachines.map((machine) => {
          const categoryInfo = categories.find((c) => c.id === machine.category);

          return (
            <div
              key={machine.id}
              className="group qc-main-card qc-machine-card myc-pattern"
              onClick={() => router.push(`/monitor?machineId=${machine.id}`)}
            >
              <div className="qc-machine-corner-accent" />

              <div className="qc-machine-top">
                <div className="qc-machine-info">
                  <h3 className="qc-machine-title">{machine.name}</h3>
                  <p className="qc-machine-model">{machine.model}</p>
                </div>
                <div className="qc-machine-status-indicator-wrap">
                  <div className={getStatusDotClass(machine.status)} />
                  <div className={getStatusPingClass(machine.status)} />
                </div>
              </div>

              <div className="qc-machine-category-wrap">
                <span className="qc-machine-category-badge">
                  <div className="qc-machine-category-dot" />
                  {categoryInfo?.name}
                </span>
              </div>

              <div className="qc-machine-footer">
                <div className="qc-machine-status-row">
                  <div className="qc-machine-status-main">
                    {machine.qcStatus === "pass" ? (
                      <CheckCircle size={18} className={getQcIconClass(machine.qcStatus)} />
                    ) : machine.qcStatus === "warning" ? (
                      <AlertTriangle size={18} className={getQcIconClass(machine.qcStatus)} />
                    ) : (
                      <XCircle size={18} className={getQcIconClass(machine.qcStatus)} />
                    )}
                    <span className="qc-machine-status-label">
                      QC Status: {machine.qcStatus === "pass" ? "Normal" : machine.qcStatus === "warning" ? "Warning" : "Reject"}
                    </span>
                  </div>
                  <div className="qc-machine-view-action">
                    <span className="qc-machine-view-text">View</span>
                    <ChevronRight size={20} className="qc-machine-view-icon" />
                  </div>
                </div>

                {machine.violationCount > 0 && (
                  <div className={getViolationBadgeClass(machine.qcStatus)}>
                    {machine.violationCount} Westgard rule violation{machine.violationCount > 1 ? "s" : ""}
                  </div>
                )}

                <div className="qc-last-qc-text">Last QC: {machine.lastQC.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
