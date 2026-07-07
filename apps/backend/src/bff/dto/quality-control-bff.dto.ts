import * as SharedTypes from "@qc/shared";
import { ApiProperty } from '@nestjs/swagger';
import { DashboardMachineTestDto, DashboardCategoryDto } from './dashboard-bff.dto';

export class QcPageMachineDto {
  id: string;
  name: string;
  category: string;
  model: string;
  tests: DashboardMachineTestDto[];
}

export class QcPageMachinesResponseDto {
  @ApiProperty({ description: 'List of machines formatted for QC selector' })
  machines: QcPageMachineDto[];

  @ApiProperty({ description: 'Categories derived from machine sections' })
  categories: DashboardCategoryDto[];
}

export class QcInteractiveHistoryEntryDto {
  id: string;
  machineId: string;
  testName: string;
  date: string;
  rawDate: string;
  performedBy: string;
  numericResult: number;
  result: string;
  expectedRange: string;
  status: SharedTypes.QualityControlResultStatus | SharedTypes.UserAlertStatus;
  notes: string;
  zScore: number;
  violatedRule: string;
  lotMean: number;
  lotSd: number;
}

export class QcPageHistoryResponseDto {
  @ApiProperty({ description: 'Paginated QC history perfectly formatted for the UI component' })
  results: QcInteractiveHistoryEntryDto[];

  @ApiProperty({ description: 'Next offset for pagination, undefined if end of list' })
  nextOffset?: number;
}
