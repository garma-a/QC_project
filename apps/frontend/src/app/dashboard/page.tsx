import { applyWestgardRules } from '@/utils/westgardRules';
import { api } from '@/lib/api/serverFetch';
import { DashboardInteractive } from '@/components/client/DashboardInteractive';
import { MachineResponseDto } from '@/lib/types/api';
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

export default async function DashboardPage() {
  
  let machines: MachineType[] = [];
  const categories: { id: string; name: string }[] = [];
  const qcHistory: {
    id: string;
    machineId: string;
    testName: string;
    date: string;
    numericResult?: number;
  }[] = [];

  // We attempt to Server fetch from backend replacing client useEffects
  try {
    const fetchedMachines = await api.get<MachineResponseDto[]>('/api/v1/machines');
    if (fetchedMachines && fetchedMachines.length > 0) {
      // mapping DTO to internal representation here
      // This bridges the DTO from swagger into the shape the UI expects
      machines = fetchedMachines.map((m: MachineResponseDto) => ({
        ...m,
        id: m.id.toString(), // UI expects string IDs
        lastQC: { date: 'N/A', status: 'pass' } // Provide defaults if missing
      })) as unknown as MachineType[];
    }
    
    // Similarly fetch QC results if endpoint exists, otherwise fallback
    // const fetchedResults = await api.get<QcResultResponseDto[]>('/api/v1/qc-results');
  } catch {
    console.error("Failed to fetch machines via Server Component");
  }

  // Server-side calculation, offloaded from the client!
  const machinesWithStatus = machines.map(machine => {
    // Get QC data for this machine
    const machineQCData = qcHistory
      .filter(qc => qc.machineId === machine.id && qc.numericResult !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Last 10 tests

    // Group by test name
    const testGroups: Record<string, typeof machineQCData> = {};
    machineQCData.forEach(qc => {
      if (!testGroups[qc.testName]) {
        testGroups[qc.testName] = [];
      }
      testGroups[qc.testName].push(qc);
    });

    // Check for violations
    let hasReject = false;
    let hasWarning = false;
    let violationCount = 0;

    Object.values(testGroups).forEach(tests => {
      if (tests.length < 2) return;
      
      const dataPoints = tests.map(t => ({
        date: t.date,
        value: t.numericResult || 0,
      }));

      const analysis = applyWestgardRules(dataPoints);
      
      if (analysis.violations.length > 0) {
        violationCount += analysis.violations.length;
        analysis.violations.forEach(v => {
          if (v.severity === 'reject') hasReject = true;
          if (v.severity === 'warning') hasWarning = true;
        });
      }
    });

    // Determine overall status
    let qcStatus: 'pass' | 'warning' | 'error' = 'pass';
    if (hasReject) {
      qcStatus = 'error';
    } else if (hasWarning) {
      qcStatus = 'warning';
    }

    return {
      ...machine,
      qcStatus,
      violationCount,
    };
  });

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
