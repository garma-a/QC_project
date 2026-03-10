import { Suspense } from "react";
import DashboardClient from "./DashboardClient";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";
import { machines, categories, qcHistory } from "@/data/mockData";

interface DashboardDataResponse {
  machines: MachineSchema[];
  categories: CategorySchema[];
  qcHistory: QCTestSchema[];
}

function DashboardLoadingSkeleton() {
  return (
    <div className="qc-dashboard-page">
      <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      <div className="mb-6 flex gap-3">
        <div className="h-10 w-28 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-52 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-52 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-52 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      </div>
    </div>
  );
}

async function getDashboardData(): Promise<DashboardDataResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        machines,
        categories,
        qcHistory,
      });
    }, 2000);
  });
}

export default async function DashboardPage() {
  const { machines, categories, qcHistory } = await getDashboardData();

  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardClient machines={machines} categories={categories} qcHistory={qcHistory} />
    </Suspense>
  );
}
