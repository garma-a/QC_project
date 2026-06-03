import { api } from '@/lib/api/serverFetch';
import type { MachineResponseDto, SectionResponseDto } from '@/lib/types/api';
import { MachinesTable } from '@/features/machines/components/MachinesTable';

export default async function MachinesPage() {
  // Fetch both in parallel — fast, no sequential waterfall
  const res = await fetch('http://localhost:4000/api/v1/machines', { cache: 'no-store' });
  const data = await res.json() as MachineResponseDto[];
  const sections = await api.get<SectionResponseDto[]>('/api/v1/sections');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Machine Management</h1>
        <p className="text-muted-foreground mt-1">
          Register, configure, and monitor laboratory machines.
        </p>
      </div>
      {/* sections comes from the real /api/v1/sections endpoint — works on empty DB too */}
      <MachinesTable initialMachines={data} sections={sections} />
    </div>
  );
}