import { api } from '@/lib/api/serverFetch';
import type { MachineResponseDto } from '@/lib/types/api';
import { MonitorClient } from '@/features/machines/components/MonitorClient';

export default async function MonitorPage(props: { searchParams: Promise<{ machineId?: string }> }) {
  // SearchParams not explicitly needed yet but kept for next.js interface
  await props.searchParams;

  let machines: (MachineResponseDto & {
    testsToday?: number;
    lastQC?: { date: string; status: string };
    tests?: { name: string; category: string; code: string; unit: string; lowRange: number; highRange: number }[];
  })[] = [];

  let categories: { id: string; name: string }[] = [];

  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      machines = fetchedMachines.map((m) => ({
        ...m,
        testsToday: 0,
        lastQC: { date: 'N/A', status: 'pass' },
        tests: [],
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

  // Note: QC results require a lotId query parameter, so we can't fetch them generically here.
  // They will be fetched on-demand when a specific machine/lot is selected.

  return (
    <MonitorClient
      machines={machines}
      categories={categories}
      qcHistory={[]}
    />
  );
}
