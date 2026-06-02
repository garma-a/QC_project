import { api } from '@/lib/api/serverFetch';
import type { MachineResponseDto, QcTestResponseDto } from '@/lib/types/api';
import { QcTestsManager } from '@/features/qc-tests/components/QcTestsManager';

export default async function QcTestsPage() {
  const [machines, allTests] = await Promise.all([
    api.get<MachineResponseDto[]>('/api/v1/machines'),
    api.get<QcTestResponseDto[]>('/api/v1/qc-tests'),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QC Tests Management</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage QC tests for laboratory machines.
        </p>
      </div>
      <QcTestsManager machines={machines} allTests={allTests} />
    </div>
  );
}
