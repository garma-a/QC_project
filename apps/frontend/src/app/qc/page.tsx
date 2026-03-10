import { Suspense } from "react";
import QCClient from "./QCClient";
import { qcHistory, machines, categories } from "@/data/mockData";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";

interface QCDataResponse {
  qcHistory: QCTestSchema[];
  machines: MachineSchema[];
  categories: CategorySchema[];
}

function QCLoadingSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border-2 border-[#c41e3a]/20 bg-white p-6 shadow-lg dark:border-[#e84855]/30 dark:bg-[#1e1e1e]">
        <div className="mb-4 h-6 w-48 animate-pulse rounded-lg bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
          <div className="h-20 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
          <div className="h-20 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        </div>
      </div>
    </div>
  );
}

async function fetchQCData(): Promise<QCDataResponse> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    qcHistory,
    machines,
    categories,
  };
}

export default async function QCPage() {
  const { qcHistory, machines, categories } = await fetchQCData();

  return (
    <Suspense fallback={<QCLoadingSkeleton />}>
      <QCClient qcHistory={qcHistory} machines={machines} categories={categories} />
    </Suspense>
  );
}
