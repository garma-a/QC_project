'use client';

import type { MachineResponseDto, QcTestResponseDto } from '@/lib/types/api';
import { CreateQcTestDialog } from './CreateQcTestDialog';
import { QcTestsTable } from './QcTestsTable';

interface QcTestsManagerProps {
  machines: MachineResponseDto[];
  allTests: QcTestResponseDto[];
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
