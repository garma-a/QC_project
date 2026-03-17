import { api } from '@/lib/api/serverFetch';
import { MachineResponseDto, QcResultResponseDto } from '@/lib/types/api';
import { MonitorClient } from '@/components/client/MonitorClient';

type MachineType = {
  id: string;
  category: string;
  name: string;
  model: string;
  status: string;
  lastMaintenance?: string | null;
  location?: string;
  testsToday?: number;
  lastQC?: { date: string; status: string };
  tests?: { name: string; category: string; code: string; unit: string; lowRange: number; highRange: number }[];
};

export default async function MonitorPage(props: { searchParams: Promise<{ machineId?: string }> }) {

  // SearchParams not explicitly needed yet but kept for next.js interface
  await props.searchParams;

  let machines: MachineType[] = [];
  const categories: { id: string; name: string }[] = [];
  let qcHistory: {
    id: string;
    machineId: string;
    status: string;
    testName: string;
    date: string;
    performedBy: string;
    result: string;
    expectedRange: string;
  }[] = [];

  // We attempt to Server fetch from backend replacing client useEffects
  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      // map to internal representation with fallbacks
      machines = fetchedMachines.map((m: MachineResponseDto) => ({
        ...m,
        id: m.id.toString(),
        lastQC: (m as unknown as Record<string, unknown>).lastQC || { date: 'N/A', status: 'pass' },
        tests: (m as unknown as Record<string, unknown>).tests || []
      })) as unknown as MachineType[];
    }

    const fetchedHistory = await api.get<QcResultResponseDto[]>('/api/v1/qc-results');
    if (fetchedHistory && fetchedHistory.length > 0) {
      qcHistory = fetchedHistory as unknown as typeof qcHistory;
    }
  } catch {
    console.error("Failed to fetch machines/qc-results via Server Component");
  }

  return (
    <MonitorClient 
      machines={machines} 
      categories={categories} 
      qcHistory={qcHistory}
    />
  );
}
