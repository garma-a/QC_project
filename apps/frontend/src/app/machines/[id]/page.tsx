import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Server, Hash, Clock, CalendarDays, Wrench } from 'lucide-react';
import type { MachineResponseDto } from '@/lib/types/api';
import { MachineFormDialog } from '@/features/machines/components/MachineFormDialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  IDLE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RUNNING: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  OFFLINE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
}

export default async function MachineDetailPage({ params }: PageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value ?? '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Fetch the single machine by ID — NOT the whole list
  const [machineRes, sectionsRes] = await Promise.all([
    fetch(`http://localhost:4000/api/v1/machines/${id}`, { cache: 'no-store', headers }),
    fetch('http://localhost:4000/api/v1/sections', { cache: 'no-store', headers }),
  ]);

  if (machineRes.status === 404) notFound();

  const machine: MachineResponseDto = await machineRes.json();
  const sections = sectionsRes.ok ? await sectionsRes.json() : [];

  const statusClass = STATUS_STYLES[machine.currentStatus] ?? STATUS_STYLES.IDLE;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back navigation */}
      <Link
        href="/machines"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#c41e3a] dark:hover:text-[#e84855] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to all machines
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {machine.name}
          </h1>
          {machine.hospCode && (
            <p className="text-muted-foreground mt-1">{machine.hospCode}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusClass}`}>
            {machine.currentStatus}
          </span>
          <MachineFormDialog mode="edit" initialData={machine} sections={sections} />
        </div>
      </div>

      {/* Decorative line */}
      <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full" />

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#c41e3a]/10 dark:bg-[#e84855]/20 rounded-lg">
              <Hash className="text-[#c41e3a] dark:text-[#e84855]" size={18} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Machine ID</p>
          </div>
          <p className="text-gray-900 dark:text-white font-bold text-lg">{machine.id}</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#b8860b]/10 dark:bg-[#ffd700]/20 rounded-lg">
              <Server className="text-[#b8860b] dark:text-[#ffd700]" size={18} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Section ID</p>
          </div>
          <p className="text-gray-900 dark:text-white font-bold text-lg">{machine.sectionId}</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#003366]/10 dark:bg-[#4a90e2]/20 rounded-lg">
              <Activity className="text-[#003366] dark:text-[#4a90e2]" size={18} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status</p>
          </div>
          <p className={`font-bold text-lg ${statusClass.split(' ').slice(2).join(' ')}`}>
            {machine.currentStatus}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#c41e3a]/10 dark:bg-[#e84855]/20 rounded-lg">
              <Clock className="text-[#c41e3a] dark:text-[#e84855]" size={18} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Last QC Run</p>
          </div>
          <p className="text-gray-900 dark:text-white font-semibold text-sm font-mono">
            {formatDate(machine.lastRunAt)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#b8860b]/10 dark:bg-[#ffd700]/20 rounded-lg">
              <CalendarDays className="text-[#b8860b] dark:text-[#ffd700]" size={18} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Created At</p>
          </div>
          <p className="text-gray-900 dark:text-white font-semibold text-sm font-mono">
            {formatDate(machine.createdAt)}
          </p>
        </div>

        {machine.specialization && (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#003366]/10 dark:bg-[#4a90e2]/20 rounded-lg">
                <Wrench className="text-[#003366] dark:text-[#4a90e2]" size={18} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Specialization</p>
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-lg capitalize">
              {machine.specialization.toLowerCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
