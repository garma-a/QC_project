import { api } from '@/lib/api/serverFetch';
import { DashboardInteractive, type MachineWithQcStatus } from '@/features/dashboard/components/DashboardInteractive';
import type { MachineResponseDto } from '@/lib/types/api';

export default async function DashboardPage() {
  let machinesWithStatus: MachineWithQcStatus[] = [];
  let categories: { id: string; name: string }[] = [];

  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && Array.isArray(fetchedMachines)) {
      machinesWithStatus = fetchedMachines.map((m) => ({
        ...m,
        qcStatus: 'pass' as const,
        violationCount: 0,
        lastQC: { date: 'N/A' },
      }));

      // Derive categories from unique sectionIds in the machine data
      const sectionIds = [...new Set(fetchedMachines.map((m) => m.sectionId))];
      categories = sectionIds.map((sid) => ({
        id: sid.toString(),
        name: `Section ${sid}`,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch machines via Server Component:", err);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header with Magdi Yacoub Branding */}
      <div className="mb-8">
        <div className="mb-4" />

        {/* Decorative line with heart center branding */}
        <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full" />
      </div>

      <DashboardInteractive
        machinesWithStatus={machinesWithStatus}
        categories={categories}
      />
    </div>
  );
}
