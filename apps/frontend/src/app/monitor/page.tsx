import { Suspense } from "react";
import MonitorClient from "./MonitorClient";
import { machines, qcHistory, categories } from "@/data/mockData";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";

interface MonitorDataResponse {
  machines: MachineSchema[];
  qcHistory: QCTestSchema[];
  categories: CategorySchema[];
}

function MonitorLoadingSkeleton() {
  return (
    <div className="qc-monitor-page">
      <div className="qc-monitor-top-row">
        <div className="h-10 w-24 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-10 w-10 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      </div>

      <div className="qc-monitor-header-accent" />

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-32 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-32 animate-pulse rounded-2xl bg-[#b8860b]/10 dark:bg-[#ffd700]/20" />
        <div className="h-32 animate-pulse rounded-2xl bg-[#003366]/10 dark:bg-[#4a90e2]/20" />
      </div>

      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      </div>
    </div>
  );
}

async function fetchMonitorData(): Promise<MonitorDataResponse> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    machines,
    qcHistory,
    categories,
  };
}

export default async function MonitorPage() {
  const data = await fetchMonitorData();

  return (
    <Suspense fallback={<MonitorLoadingSkeleton />}>
      <MonitorClient
        machines={data.machines}
        qcHistory={data.qcHistory}
        categories={data.categories}
      />
    </Suspense>
  );
}
