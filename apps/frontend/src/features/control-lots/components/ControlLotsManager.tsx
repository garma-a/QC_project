'use client';

import type { ControlLotResponseDto, QcTestResponseDto } from '@/lib/types/api';
import { ControlLotFormDialog } from './ControlLotFormDialog';
import { ControlLotsTable } from './ControlLotsTable';

interface ControlLotsManagerProps {
  initialLots: ControlLotResponseDto[];
  availableTests: QcTestResponseDto[];
}

export function ControlLotsManager({ initialLots, availableTests }: ControlLotsManagerProps) {
  return (
    <>
      {/* Header row — button right, matches QC Management layout exactly */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex-1" />
        <ControlLotFormDialog mode="create" availableTests={availableTests} initialLots={initialLots} />
      </div>

      {/* Decorative gradient line — identical to QC Management page */}
      <div className="h-1 bg-gradient-to-r from-[#c41e3a] via-[#b8860b] to-[#003366] dark:from-[#e84855] dark:via-[#ffd700] dark:to-[#4a90e2] rounded-full mb-6" />

      {/* Control Lots Table + Filters */}
      <ControlLotsTable initialLots={initialLots} availableTests={availableTests} />
    </>
  );
}
