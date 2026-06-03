'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteMachine } from '@/lib/actions';
import { useMachines } from '@/hooks/useMachines';
import { MachineFormDialog } from './MachineFormDialog';
import type { MachineResponseDto, SectionResponseDto } from '@/lib/types/api';

interface MachinesTableProps {
  initialMachines: MachineResponseDto[];
  sections: SectionResponseDto[];
}

export function MachinesTable({ initialMachines, sections }: MachinesTableProps) {
  const { machines: fetchedMachines, fetchNextPage, hasNextPage, isFetchingNextPage } = useMachines();
  const displayMachines = fetchedMachines.length > 0 ? fetchedMachines : initialMachines;
  const [isMounted, setIsMounted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<MachineResponseDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper to map sectionId to section name
  const getSectionName = (sectionId: number) => {
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  // Helper for Status Badge using Part 8 colors
  const getStatusBadge = (status: string) => {
    const classMap: Record<string, string> = {
      'IDLE': 'bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700',
      'RUNNING': 'bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700',
      'MAINTENANCE': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700',
      'OFFLINE': 'bg-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-700',
      'ERROR': 'bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700',
    };

    const colorClass = classMap[status] || classMap['IDLE'];
    
    return (
      <Badge className={`border-none ${colorClass}`} variant="outline">
        {status}
      </Badge>
    );
  };

  const formatLastRun = (dateValue: any): string => {
    if (!isMounted) return '...';
    if (!dateValue) return 'Never';
    try {
      return new Date(dateValue).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDeleteClick = (machine: MachineResponseDto) => {
    setMachineToDelete(machine);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!machineToDelete) return;

    startTransition(async () => {
      const result = await deleteMachine(machineToDelete.id);
      if (result?.error) {
        setDeleteError(result.error);
      } else {
        setDeleteConfirmOpen(false);
        setMachineToDelete(null);
        setDeleteError(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header section with Create Dialog aligned right */}
      <div className="flex items-center justify-end">
        <MachineFormDialog mode="create" sections={sections} />
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 dark:bg-zinc-900/50 border-b-2 border-[#c41e3a]/10 dark:border-[#e84855]/20">
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4 pl-6">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Hospital Code</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Section</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Last Run</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!displayMachines || displayMachines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm py-4">
                  No machines found. Click &quot;Add Machine&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              displayMachines.map((machine) => (
                <TableRow
                  key={machine.id}
                  className="border-b border-[#c41e3a]/10 dark:border-[#e84855]/10 hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <TableCell className="font-semibold text-sm py-4 pl-6 text-gray-900 dark:text-white">{machine.name}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-700 dark:text-gray-300">{machine.hospCode || '-'}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-700 dark:text-gray-300">{getSectionName(machine.sectionId)}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-700 dark:text-gray-300">{getStatusBadge(machine.currentStatus)}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-600 dark:text-gray-400 font-mono">
                    {formatLastRun(machine.lastRunAt as unknown)}
                  </TableCell>
                  <TableCell className="text-sm py-4 pr-6 text-right flex items-center justify-end gap-2">
                    <MachineFormDialog mode="edit" initialData={machine} sections={sections} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-red-600"
                      onClick={() => handleDeleteClick(machine)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {hasNextPage && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-sm text-gray-500">
                  <div
                    ref={(node) => {
                      if (!node) return;
                      const observer = new IntersectionObserver(
                        (entries) => {
                          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                          }
                        },
                        { threshold: 0.1 }
                      );
                      observer.observe(node);
                      return () => observer.disconnect();
                    }}
                  >
                    {isFetchingNextPage ? 'Loading more...' : 'Scroll for more'}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeleteError(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{machineToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {deleteError}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
