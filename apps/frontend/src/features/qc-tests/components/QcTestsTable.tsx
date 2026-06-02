'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import type { MachineResponseDto, QcTestResponseDto } from '@/lib/types/api';
import { QcTestFormDialog } from './QcTestFormDialog';

interface QcTestsTableProps {
  machines: MachineResponseDto[];
  allTests: QcTestResponseDto[];
}

export function QcTestsTable({ machines, allTests }: QcTestsTableProps) {
  // Helper to find machine name by machineId
  const getMachineName = (machineId: number): string => {
    const machine = machines.find((m) => m.id === machineId);
    return machine ? machine.name : 'Unknown Machine';
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTests = allTests.filter((test) => {
    const machineName = getMachineName(test.machineId).toLowerCase();
    const query = searchQuery.toLowerCase();
    return test.testName.toLowerCase().includes(query) || machineName.includes(query);
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6 w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c41e3a]/60 dark:text-[#e84855]/60" size={20} />
          <input
            type="text"
            placeholder="Search tests or machines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-[#c41e3a]/20 dark:border-[#e84855]/30 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c41e3a] dark:focus:ring-[#e84855] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <QcTestFormDialog mode="create" machines={machines} />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border-2 border-[#c41e3a]/10 dark:border-[#e84855]/20 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 dark:bg-zinc-900/50 border-b-2 border-[#c41e3a]/10 dark:border-[#e84855]/20">
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4 pl-6">Test Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Test Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4">Machine Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredTests || filteredTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm py-4">
                  No QC tests match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredTests.map((test) => (
                <TableRow
                  key={test.id}
                  className="border-b border-[#c41e3a]/10 dark:border-[#e84855]/10 hover:bg-[#fff8f0] dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <TableCell className="font-semibold text-sm py-4 pl-6 text-gray-900 dark:text-white">{test.testName}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-700 dark:text-gray-300">{test.testType || '-'}</TableCell>
                  <TableCell className="text-sm py-4 text-gray-700 dark:text-gray-300">{getMachineName(test.machineId)}</TableCell>
                  <TableCell className="flex items-center justify-end gap-2 text-sm py-4 pr-6 text-right">
                    <QcTestFormDialog mode="edit" initialData={test} machines={machines} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 cursor-not-allowed hover:text-gray-400 hover:bg-transparent"
                      disabled
                      title="Delete not available for QC Tests"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
