import { cookies } from 'next/headers';
import type { MachineResponseDto, SectionResponseDto } from '@/lib/types/api';
import { MachinesTable } from '@/features/machines/components/MachinesTable';

export default async function MachinesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value ?? '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Fetch both in parallel — fast, no sequential waterfall
  const [machinesRes, sectionsRes] = await Promise.all([
    fetch('http://localhost:4000/api/v1/machines', { cache: 'no-store', headers }),
    fetch('http://localhost:4000/api/v1/sections', { cache: 'no-store', headers }),
  ]);

  const machines: MachineResponseDto[] = machinesRes.ok ? await machinesRes.json() : [];
  const sections: SectionResponseDto[] = sectionsRes.ok ? await sectionsRes.json() : [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Machine Management</h1>
        <p className="text-muted-foreground mt-1">
          Register, configure, and monitor laboratory machines.
        </p>
      </div>
      {/* sections comes from the real /api/v1/sections endpoint — works on empty DB too */}
      <MachinesTable initialMachines={machines} sections={sections} />
    </div>
  );
}