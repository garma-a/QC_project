import { api } from '@/lib/api/serverFetch';
import type { ControlLotResponseDto, QcTestResponseDto, MachineResponseDto } from '@/lib/types/api';
import { ControlLotsManager } from '@/features/control-lots/components/ControlLotsManager';

export default async function ControlLotsPage() {
  // Fetch lots and machines in parallel
  const [lots, machines] = await Promise.all([
    api.get<ControlLotResponseDto[]>('/api/v1/control-lots'),
    api.get<MachineResponseDto[]>('/api/v1/machines'),
  ]);

  // Fetch tests for each machine in parallel, with error handling
  const testsByMachine = await Promise.all(
    machines.map((m) =>
      api.get<QcTestResponseDto[]>(`/api/v1/qc-tests/machine/${m.id}`)
        .catch(() => [] as QcTestResponseDto[])
    )
  );
  const allTests = testsByMachine.flat();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control Lots</h1>
        <p className="text-muted-foreground mt-1">
          Manage control materials and their statistical acceptance limits.
        </p>
      </div>
      <ControlLotsManager initialLots={lots} availableTests={allTests} />
    </div>
  );
}
