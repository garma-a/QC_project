import { api } from '@/lib/api/serverFetch';
import type { MachineResponseDto } from '@/lib/types/api';
import { QCHistoryInteractive } from '@/components/client/QCHistoryInteractive';

type MachineType = { id: string; name: string; category: string; model: string };
type CategoryType = { id: string; name: string };
type QcHistoryType = {
  id: string;
  machineId: string;
  testName: string;
  date: string;
  performedBy: string;
  numericResult?: number;
  result: string;
  expectedRange: string;
  status: string;
  notes?: string | null;
};

export default async function QCPage() {
  let machines: MachineType[] = [];
  let categories: CategoryType[] = [];
  const qcHistory: QcHistoryType[] = [];

  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      // Map MachineResponseDto to the shape expected by QCHistory/CreateQCTest components
      machines = fetchedMachines.map((m) => ({
        id: m.id.toString(),
        name: m.name,
        category: m.sectionId.toString(),
        model: m.hospCode ?? '',
      }));

      // Derive categories from unique sectionIds
      const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
      categories = sectionIds.map((sid) => ({
        id: sid.toString(),
        name: `Section ${sid}`,
      }));
    }
  } catch {
    console.error("Failed to fetch machines via Server Component");
  }

  // Note: There is no GET /api/v1/qc-tests (list all) endpoint.
  // QC tests can only be fetched per machine via GET /api/v1/qc-tests/machine/{machineId}.
  // QC history will be loaded on-demand when a machine is selected.

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <QCHistoryInteractive 
        qcHistory={qcHistory} 
        machines={machines} 
        categories={categories} 
      />
    </div>
  );
}
