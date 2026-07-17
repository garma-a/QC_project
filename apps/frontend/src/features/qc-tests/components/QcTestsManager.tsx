'use client';

import type { MachineResponseDto, QualityControlTestResponseDto } from '@/lib/types/api';

import { QcTestsTable } from './QcTestsTable';

interface QcTestsManagerProps {
  machines: MachineResponseDto[];
  allTests: QualityControlTestResponseDto[];
}

export function QcTestsManager({ machines, allTests }: QcTestsManagerProps) {
  return (
    <div className="space-y-4">
      {/* Header section with Create Dialog moved to QcTestsTable */}


      {/* Tests Table */}
      <QcTestsTable machines={machines} allTests={allTests} />
    </div>
  );
}
