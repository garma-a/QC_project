import { api } from '@/lib/api/serverFetch';
import { MachineResponseDto, QcTestResponseDto } from '@/lib/types/api';
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
  const categories: CategoryType[] = [];
  let qcHistory: QcHistoryType[] = [];

  // We attempt to Server fetch from backend replacing client useEffects
  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      // map to internal representation with fallbacks
      machines = fetchedMachines.map((m: MachineResponseDto) => ({
        ...m,
        id: m.id.toString(),
      })) as unknown as MachineType[];
    }

    const fetchedHistory = await api.get<QcTestResponseDto[]>('/api/v1/qc-tests');
    if (fetchedHistory && fetchedHistory.length > 0) {
      qcHistory = fetchedHistory as unknown as QcHistoryType[];
    }
  } catch {
    console.error("Failed to fetch machines/qc-tests via Server Component");
  }

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
