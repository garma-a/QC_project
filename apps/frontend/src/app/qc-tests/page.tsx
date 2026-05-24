import { api } from '@/lib/api/serverFetch';
import type { MachineResponseDto, QcTestResponseDto } from '@/lib/types/api';
import { QcTestsManager } from '@/features/qc-tests/components/QcTestsManager';

export default async function QcTestsPage() {
  // Fetch all machines first
  const machines = await api.get<MachineResponseDto[]>('/api/v1/machines');

  // Fetch tests for each machine in parallel
  const testsByMachine = await Promise.all(
    machines.map((m) =>
      api.get<QcTestResponseDto[]>(`/api/v1/qc-tests/machine/${m.id}`)
        .catch(() => [] as QcTestResponseDto[])
    )
  );

  // Flatten all tests into a single array
  const allTests = testsByMachine.flat();

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
