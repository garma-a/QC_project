"use client";

import { useState } from "react";
import { QCHistory } from "@/components/QCHistory";
import type { CategorySchema, MachineSchema, QCTestSchema } from "@/types/schema";

type QCClientProps = {
  qcHistory: QCTestSchema[];
  machines: MachineSchema[];
  categories: CategorySchema[];
};

export default function QCClient({ qcHistory, machines, categories }: QCClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <QCHistory
        qcHistory={qcHistory}
        machines={machines}
        categories={categories}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />
    </div>
  );
}
