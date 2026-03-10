"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { MachineCharts } from "@/components/MachineCharts";
import { LogoCompact } from "@/components/Logo";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";

type MonitorClientProps = {
  machines: MachineSchema[];
  qcHistory: QCTestSchema[];
  categories: CategorySchema[];
};

const getMonitorMachineDotClass = (status: MachineSchema["status"]) => {
  if (status === "operational") {
    return "qc-monitor-status-dot qc-monitor-status-dot-operational";
  }

  if (status === "warning") {
    return "qc-monitor-status-dot qc-monitor-status-dot-warning";
  }

  return "qc-monitor-status-dot qc-monitor-status-dot-error";
};

const getMonitorMachinePingClass = (status: MachineSchema["status"]) => {
  if (status === "operational") {
    return "qc-monitor-status-ping qc-monitor-status-ping-operational";
  }

  if (status === "warning") {
    return "qc-monitor-status-ping qc-monitor-status-ping-warning";
  }

  return "qc-monitor-status-ping qc-monitor-status-ping-error";
};

const getMonitorLastQcIconClass = (status: MachineSchema["lastQC"]["status"]) => {
  return status === "pass" ? "qc-monitor-icon-pass" : "qc-monitor-icon-fail";
};

const getMonitorTabClass = (isActive: boolean) => {
  return isActive ? "qc-monitor-tab qc-monitor-tab-active" : "qc-monitor-tab qc-monitor-tab-inactive";
};

const getMonitorHeaderBadgeClass = (status: MachineSchema["status"]) => {
  if (status === "operational") {
    return "qc-monitor-header-badge qc-monitor-header-badge-operational";
  }

  if (status === "warning") {
    return "qc-monitor-header-badge qc-monitor-header-badge-warning";
  }

  return "qc-monitor-header-badge qc-monitor-header-badge-error";
};

const getMonitorCurrentStatusCardClass = (status: MachineSchema["lastQC"]["status"]) => {
  return status === "pass"
    ? "qc-monitor-status-card qc-monitor-status-card-pass"
    : "qc-monitor-status-card qc-monitor-status-card-fail";
};

const getMonitorCurrentStatusIconWrapClass = (status: MachineSchema["lastQC"]["status"]) => {
  return status === "pass"
    ? "qc-monitor-status-icon-wrap qc-monitor-status-icon-wrap-pass"
    : "qc-monitor-status-icon-wrap qc-monitor-status-icon-wrap-fail";
};

const getMonitorCurrentStatusIconClass = (status: MachineSchema["lastQC"]["status"]) => {
  return status === "pass" ? "qc-monitor-status-icon-pass" : "qc-monitor-status-icon-fail";
};

const getMonitorCurrentStatusTextClass = (status: MachineSchema["lastQC"]["status"]) => {
  return status === "pass" ? "qc-monitor-status-text-pass" : "qc-monitor-status-text-fail";
};

export default function MonitorClient({ machines, qcHistory, categories }: MonitorClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "charts">("overview");
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const machineIdFromUrl = searchParams.get("machineId");
    if (!machineIdFromUrl) {
      return;
    }

    const machineExists = machines.some((machine) => machine.id === machineIdFromUrl);
    if (machineExists) {
      const frameId = window.requestAnimationFrame(() => {
        setSelectedMachineId(machineIdFromUrl);
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [searchParams, machines]);

  const machine = machines.find((m) => m.id === selectedMachineId);
  const history = qcHistory.filter((qc) => qc.machineId === selectedMachineId);

  if (!selectedMachineId || !machine) {
    return (
      <div className="qc-monitor-page">
        <div className="qc-monitor-top-row">
          <div />
          <div className="qc-monitor-mobile-logo-wrap">
            <LogoCompact />
          </div>
        </div>

        <div className="qc-monitor-header-accent" />

        <div className="qc-monitor-category-list">
          {categories.map((category) => {
            const categoryMachines = machines.filter((m) => m.category === category.id);

            return (
              <div key={category.id} className="qc-monitor-category-block">
                <h2 className="qc-monitor-category-title-row">
                  <div className="qc-monitor-category-title-bar" />
                  <span className="qc-monitor-category-title-text">{category.name}</span>
                </h2>
                <div className="qc-monitor-machine-grid">
                  {categoryMachines.map((categoryMachine) => (
                    <div
                      key={categoryMachine.id}
                      className="group qc-monitor-machine-card myc-pattern"
                      onClick={() => setSelectedMachineId(categoryMachine.id)}
                    >
                      <div className="qc-monitor-machine-corner" />

                      <div className="qc-monitor-machine-top">
                        <div className="qc-monitor-machine-info">
                          <h3 className="qc-monitor-machine-title">{categoryMachine.name}</h3>
                          <p className="qc-monitor-machine-model">{categoryMachine.model}</p>
                        </div>
                        <div className="qc-monitor-status-wrap">
                          <div className={getMonitorMachineDotClass(categoryMachine.status)} />
                          <div className={getMonitorMachinePingClass(categoryMachine.status)} />
                        </div>
                      </div>

                      <div className="qc-monitor-machine-footer">
                        <div className="qc-monitor-machine-footer-main">
                          {categoryMachine.lastQC.status === "pass" ? (
                            <CheckCircle
                              size={18}
                              className={getMonitorLastQcIconClass(categoryMachine.lastQC.status)}
                            />
                          ) : (
                            <AlertCircle
                              size={18}
                              className={getMonitorLastQcIconClass(categoryMachine.lastQC.status)}
                            />
                          )}
                          <span className="qc-monitor-machine-footer-text">
                            Last QC: {categoryMachine.lastQC.date}
                          </span>
                        </div>
                        <ChevronRight size={20} className="qc-monitor-chevron" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="qc-monitor-page">
      <div className="qc-monitor-top-row">
        <div className="qc-monitor-top-left">
          <button onClick={() => router.push("/dashboard")} className="qc-monitor-back-button">
            <ArrowLeft size={20} className="qc-monitor-back-icon" />
            <span className="qc-monitor-back-text">Back</span>
          </button>
        </div>
        <div className="qc-monitor-mobile-logo-wrap">
          <LogoCompact />
        </div>
      </div>

      <div className="qc-monitor-tabs-row">
        <button onClick={() => setActiveTab("overview")} className={getMonitorTabClass(activeTab === "overview")}>
          Overview
        </button>
        <button onClick={() => setActiveTab("charts")} className={getMonitorTabClass(activeTab === "charts")}>
          <BarChart3 size={18} className="qc-monitor-tab-icon" />
          Analytics
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="qc-monitor-overview-wrap">
          <div className="group qc-main-card qc-monitor-machine-header myc-pattern">
            <div className="qc-monitor-machine-header-corner" />

            <div className="qc-monitor-machine-header-top">
              <div className="qc-monitor-machine-header-info">
                <h1 className="qc-monitor-machine-header-title">{machine.name}</h1>
                <p className="qc-monitor-machine-header-subtitle">{machine.model}</p>
              </div>
              <div className={getMonitorHeaderBadgeClass(machine.status)}>
                {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
              </div>
            </div>

            <div className="qc-monitor-machine-meta-grid">
              <div className="qc-monitor-machine-meta-item">
                <p className="qc-monitor-machine-meta-label">Category</p>
                <p className="qc-monitor-machine-meta-value qc-monitor-machine-meta-value-capitalize">
                  {machine.category}
                </p>
              </div>
              <div className="qc-monitor-machine-meta-item">
                <p className="qc-monitor-machine-meta-label">Location</p>
                <p className="qc-monitor-machine-meta-value">{machine.location}</p>
              </div>
              <div className="qc-monitor-machine-meta-item">
                <p className="qc-monitor-machine-meta-label">Last Maintenance</p>
                <p className="qc-monitor-machine-meta-value">{machine.lastMaintenance}</p>
              </div>
            </div>
          </div>

          {machine.tests && machine.tests.length > 0 && (
            <div className="group qc-main-card qc-monitor-tests-card">
              <h2 className="qc-monitor-section-title">Available Tests ({machine.tests.length})</h2>
              <div className="qc-monitor-tests-grid">
                {machine.tests.map((test, index) => (
                  <div key={index} className="group qc-monitor-test-item">
                    <div className="qc-monitor-test-item-top">
                      <div className="qc-monitor-test-item-info">
                        <p className="qc-monitor-test-name">{test.name}</p>
                        <p className="qc-monitor-test-category">{test.category}</p>
                        <div className="qc-monitor-test-meta-row">
                          <span className="qc-monitor-test-code-pill">Code: {test.code}</span>
                          <span className="qc-monitor-test-unit">{test.unit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="qc-monitor-test-reference-row">
                      <span className="qc-monitor-test-reference-label">Reference Range:</span>
                      <span className="qc-monitor-test-reference-value">
                        {test.lowRange} - {test.highRange} {test.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="qc-monitor-status-grid">
            <div className="group qc-main-card qc-monitor-status-card-primary">
              <div className="qc-monitor-status-card-head">
                <div className="qc-monitor-status-icon-shell qc-monitor-status-icon-shell-red">
                  <Activity className="qc-monitor-status-icon-red" size={20} />
                </div>
                <h3 className="qc-monitor-status-card-title">Tests Today</h3>
              </div>
              <p className="qc-monitor-tests-today-value">{machine.testsToday}</p>
            </div>

            <div className="group qc-main-card qc-monitor-status-card-secondary">
              <div className="qc-monitor-status-card-head">
                <div className="qc-monitor-status-icon-shell qc-monitor-status-icon-shell-gold">
                  <Calendar className="qc-monitor-status-icon-gold" size={20} />
                </div>
                <h3 className="qc-monitor-status-card-title">Last QC</h3>
              </div>
              <p className="qc-monitor-last-qc-date">{machine.lastQC.date}</p>
            </div>

            <div className={getMonitorCurrentStatusCardClass(machine.lastQC.status)}>
              <div className="qc-monitor-status-card-head">
                <div className={getMonitorCurrentStatusIconWrapClass(machine.lastQC.status)}>
                  {machine.lastQC.status === "pass" ? (
                    <CheckCircle
                      className={getMonitorCurrentStatusIconClass(machine.lastQC.status)}
                      size={20}
                    />
                  ) : (
                    <AlertCircle
                      className={getMonitorCurrentStatusIconClass(machine.lastQC.status)}
                      size={20}
                    />
                  )}
                </div>
                <h3 className="qc-monitor-status-card-title">QC Status</h3>
              </div>
              <p className={getMonitorCurrentStatusTextClass(machine.lastQC.status)}>
                {machine.lastQC.status.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="group qc-main-card qc-monitor-history-card">
            <h2 className="qc-monitor-section-title">Quality Control History</h2>

            <div className="qc-monitor-history-list">
              {history.map((qc) => (
                <div key={qc.id} className="qc-monitor-history-item">
                  <div className="qc-monitor-history-item-main">
                    {qc.status === "pass" ? (
                      <CheckCircle className="qc-monitor-history-icon-pass" size={20} />
                    ) : (
                      <AlertCircle className="qc-monitor-history-icon-fail" size={20} />
                    )}
                    <div className="qc-monitor-history-text-wrap">
                      <p className="qc-monitor-history-test-name">{qc.testName}</p>
                      <p className="qc-monitor-history-meta">
                        {qc.date} - {qc.performedBy}
                      </p>
                    </div>
                  </div>
                  <div className="qc-monitor-history-result-wrap">
                    <p className="qc-monitor-history-result">Result: {qc.result}</p>
                    <p className="qc-monitor-history-expected">Expected: {qc.expectedRange}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <MachineCharts machineId={selectedMachineId ?? undefined} />
      )}
    </div>
  );
}