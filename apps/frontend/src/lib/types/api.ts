// ===================================================================
// Enums — match backend Drizzle pgEnum definitions exactly
// ===================================================================

export type Role = 'TECHNICIAN' | 'ADMIN';
export type Specialization =
  | 'HEMATOLOGY'
  | 'CHEMISTRY'
  | 'MICROBIOLOGY'
  | 'IMMUNOLOGY'
  | 'OTHER';
export type QcResultStatus = 'PASS' | 'FAIL' | 'WARNING';
export type MachineStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'ERROR';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// ===================================================================
// Auth DTOs
// ===================================================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
}

// ===================================================================
// User DTOs
// ===================================================================

export interface UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  sectionIds: number[];
  sectionNames?: string[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserListItemDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  sectionIds: number[];
  sectionNames: string[];
}

export interface AdminCreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: Role;
  isActive?: boolean;
  sectionIds?: number[];
}

export interface AdminUpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
  sectionIds?: number[];
}

export interface DeactivateUserResponseDto {
  message: string;
}

// ===================================================================
// Section DTOs (schema exists, no API endpoint yet)
// ===================================================================

export interface SectionResponseDto {
  id: number;
  name: string;
  location?: string | null;
  specialization?: Specialization | null;
  createdAt: string;
  updatedAt?: string | null;
}

// ===================================================================
// Machine DTOs
// ===================================================================

export interface MachineResponseDto {
  id: number;
  name: string;
  hospCode?: string | null;
  sectionId: number;
  currentStatus: MachineStatus;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  specialization?: Specialization | null;
}

export interface CreateMachineDto {
  name: string;
  sectionId: number;
  hospCode?: string;
}

export interface UpdateMachineDto {
  name?: string;
  hospCode?: string;
  sectionId?: number;
}

// ===================================================================
// QC Test DTOs
// ===================================================================

export interface QcTestResponseDto {
  id: number;
  testName: string;
  testType?: string | null;
  machineId: number;
  updatedAt?: string | null;
}

export interface CreateQcTestDto {
  testName: string;
  testType?: string;
  machineId: number;
}

export interface UpdateQcTestDto {
  testName?: string;
  testType?: string;
  machineId?: number;
}

// ===================================================================
// Control Lot DTOs
// ===================================================================

export interface ControlLotResponseDto {
  id: number;
  testId: number;
  level: number;
  lotNumber: string;
  expirationDate: string;
  targetValue?: number | null;
  mean?: number | null;
  standardDeviation?: number | null;
  upperControlLimit?: number | null;
  lowerControlLimit?: number | null;
  upperWarningLimit?: number | null;
  lowerWarningLimit?: number | null;
  isActive: boolean;
  createdAt: string;
  daysActive?: number;
  needsChecking?: boolean;
}

export interface CreateControlLotDto {
  testId: number;
  lotNumber: string;
  expirationDate: string;
  targetValue?: number;
  mean?: number;
  standardDeviation?: number;
  upperControlLimit?: number;
  lowerControlLimit?: number;
  upperWarningLimit?: number;
  lowerWarningLimit?: number;
}

export interface UpdateControlLotDto {
  expirationDate?: string;
  targetValue?: number;
  mean?: number;
  standardDeviation?: number;
  upperControlLimit?: number;
  lowerControlLimit?: number;
  upperWarningLimit?: number;
  lowerWarningLimit?: number;
  isActive?: boolean;
}

export interface ControlLotDeactivateResponseDto {
  message: string;
  lot: ControlLotResponseDto;
}

export interface ControlLotInResultDto {
  id: number;
  testId: number;
  level: number;
  lotNumber: string;
  expirationDate: string;
  targetValue?: number | null;
  mean?: number | null;
  standardDeviation?: number | null;
  upperControlLimit?: number | null;
  lowerControlLimit?: number | null;
  upperWarningLimit?: number | null;
  lowerWarningLimit?: number | null;
  isActive: boolean;
  createdAt: string;
}

// ===================================================================
// QC Result DTOs
// ===================================================================

export interface QcResultResponseDto {
  id: number;
  measuredValue: number;
  testDate: string;
  status: QcResultStatus;
  comments?: string | null;
  lotId: number;
  performedBy: number;
  zScore: number;
  violatedRule: string | null;
}

export interface QcResultItemDto {
  lotId: number;
  measuredValue: number;
  comments?: string;
}

export interface CreateQcResultDto {
  machineId: number;
  results: QcResultItemDto[];
}

export interface QcRunDto {
  id: number;
  machineId: number;
  testId: number;
  performedBy: number;
  runDate: string;
}

export interface QcRunResultResponseDto {
  id: number;
  measuredValue: number;
  zScore: number;
  violatedRule: string | null;
  status: QcResultStatus;
  comments?: string | null;
  runId: number;
  lotId: number;
}

export interface QcRunResponseDto {
  run: QcRunDto;
  results: QcRunResultResponseDto[];
}


export interface UpdateQcResultDto {
  comments?: string;
}

export interface QcResultDetailResponseDto {
  id: number;
  measuredValue: number;
  testDate: string;
  status: QcResultStatus;
  comments?: string | null;
  lotId: number;
  performedBy: number;
  controlLot: ControlLotInResultDto;
  zScore: number;
  violatedRule: string | null;
}

export interface LotSummaryDto {
  id: number;
  lotNumber: string;
  mean?: number | null;
  standardDeviation?: number | null;
  upperControlLimit?: number | null;
  lowerControlLimit?: number | null;
  upperWarningLimit?: number | null;
  lowerWarningLimit?: number | null;
  testName: string;
  machineName: string;
}

export interface QcResultsWithLotResponseDto {
  lot: LotSummaryDto;
  results: QcResultResponseDto[];
}

// ===================================================================
// Alert DTOs
// ===================================================================

export interface AlertResponseDto {
  id: number;
  type?: string | null;
  priority?: AlertPriority | null;
  message?: string | null;
  ruleViolated?: string | null;
  suggestedSolution?: string | null;
  resultId: number;
  createdAt?: string | null;
  status: UserAlertStatus;
  seenAt?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

export type UserAlertStatus = 'UNSEEN' | 'SEEN' | 'RESOLVED';

export interface UserAlertStatusResponseDto {
  userId: number;
  alertId: number;
  status: UserAlertStatus;
  seenAt?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

export interface ResolveAlertDto {
  resolutionNote?: string;
}

// ===================================================================
// Error DTOs
// ===================================================================

export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error?: string;
}
