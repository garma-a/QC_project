import { api } from '@/lib/api/serverFetch';
import type {
  ControlLotResponseDto,
  MachineResponseDto,
  QcTestResponseDto,
} from '@/lib/types/api';
import { ControlLotManager } from '@/features/qc/components/ControlLotManager';

export default async function ControlLotsPage() {
  let lots: ControlLotResponseDto[] = [];
  let machines: MachineResponseDto[] = [];
  let allTests: { machineId: number; test: QcTestResponseDto }[] = [];

  try {
    machines = await api.get<MachineResponseDto[]>('/api/v1/machines').catch(() => []);

    if (machines.length > 0) {
      const [fetchedLots, testsByMachine] = await Promise.all([
        api.get<ControlLotResponseDto[]>('/api/v1/control-lots').catch(() => []),
        Promise.all(
          machines.map(async (machine) => {
            try {
              const tests = await api.get<QcTestResponseDto[]>(
                `/api/v1/qc-tests/machine/${machine.id}`,
              );
              return tests.map((t) => ({ machineId: machine.id, test: t }));
            } catch {
              return [] as { machineId: number; test: QcTestResponseDto }[];
            }
          }),
        ),
      ]);

      lots = fetchedLots;
      allTests = testsByMachine.flat();
    }
  } catch (error) {
    console.error('Failed to fetch data for Control Lots Page', error);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ControlLotManager initialLots={lots} machines={machines} allTests={allTests} />
    </div>
  );
}
