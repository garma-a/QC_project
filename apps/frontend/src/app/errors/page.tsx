import { Suspense } from "react";
import ErrorsClient from "./ErrorsClient";
import { allErrors } from "@/data/mockData";
import type { MachineErrorSchema } from "@/types/schema";

interface ErrorsDataResponse {
  allErrors: MachineErrorSchema[];
}

function ErrorsLoadingSkeleton() {
  return (
    <div className="qc-errors-page">
      <div className="qc-errors-header">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-lg bg-[#003366]/10 dark:bg-[#4a90e2]/20" />
        <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2]" />
      </div>

      <div className="mt-6 rounded-2xl border-2 border-[#c41e3a]/20 bg-white p-5 shadow-lg dark:border-[#e84855]/30 dark:bg-[#1e1e1e]">
        <div className="mb-4 h-10 animate-pulse rounded-xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl bg-[#b8860b]/10 dark:bg-[#ffd700]/20" />
          <div className="h-20 animate-pulse rounded-xl bg-[#003366]/10 dark:bg-[#4a90e2]/20" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#c41e3a]/10 dark:bg-[#e84855]/20" />
      </div>
    </div>
  );
}

async function fetchErrorsData(): Promise<ErrorsDataResponse> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    allErrors,
  };
}

export default async function ErrorsPage() {
  const data = await fetchErrorsData();

  return (
    <Suspense fallback={<ErrorsLoadingSkeleton />}>
      <ErrorsClient allErrors={data.allErrors} />
    </Suspense>
  );
}
