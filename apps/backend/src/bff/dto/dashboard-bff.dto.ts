import * as SharedTypes from "@qc/shared";
import { ApiProperty } from '@nestjs/swagger';

export class DashboardMachineTestDto {
  id: string;
  name: string;
  category: string;
  code: string;
  unit: string;
  lowRange: number;
  highRange: number;
  lotId: number;
  level: number;
  lotNumber: string;
  isActive: boolean;
  mean: number;
  standardDeviation: number;
}

export class DashboardMachineDto {
  id: number;
  name: string;
  status: SharedTypes.QualityControlResultStatus | SharedTypes.UserAlertStatus;
  model: string;
  serialNumber: string;
  location: string;
  installationDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  createdAt: string;
  updatedAt: string;
  sectionId: number;
  
  testsToday?: number;
  lastQC?: { date: string; status: string };
  tests?: DashboardMachineTestDto[];
}

export class DashboardCategoryDto {
  id: string;
  name: string;
}

export class DashboardQcHistoryDto {
  id: number;
  testId: number;
  lotId: number;
  machineId: number;
  technicianId: number;
  testDate: string;
  value: number;
  zScore: number;
  status: SharedTypes.QualityControlResultStatus | SharedTypes.UserAlertStatus;
  violatedRule: string;
  comments: string;
  createdAt: string;
  updatedAt: string;
  
  // Enriched
  testName: string;
  testType: string;
  lotNumber: string;
  lotLevel: number;
  lotMean: number;
  lotSd: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  
  // Formatted for UI
  date: string;
  expectedRange: string;
  level: number;
}

export class DashboardBffResponseDto {
  @ApiProperty({ description: 'List of machines with their active tests and QC status' })
  machines: DashboardMachineDto[];

  @ApiProperty({ description: 'Categories derived from machine sections' })
  categories: DashboardCategoryDto[];

  @ApiProperty({ description: 'Recent QC history formatted for the UI' })
  qcHistory: DashboardQcHistoryDto[];
}
