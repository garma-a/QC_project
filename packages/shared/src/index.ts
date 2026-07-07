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
export type QualityControlResultStatus = 'PASS' | 'FAIL' | 'WARNING';
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
  refreshToken?: string;
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
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

export interface ProfileResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phone: string | null;
  emailNotificationsEnabled: boolean;
  subscribeToAllSections: boolean;
  assignedSections: { id: number; name: string; specialization: string | null }[];
  createdAt: string | Date;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  emailNotificationsEnabled?: boolean;
  subscribeToAllSections?: boolean;
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
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

// ===================================================================
// Machine DTOs
// ===================================================================

export interface MachineResponseDto {
  id: number;
  name: string;
  hospitalCode?: string | null;
  sectionId: number;
  currentStatus: MachineStatus;
  lastRunAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  specialization?: Specialization | null;
}

export interface CreateMachineDto {
  name: string;
  sectionId: number;
  hospitalCode?: string;
}

export interface UpdateMachineDto {
  name?: string;
  hospitalCode?: string;
  sectionId?: number;
}

// ===================================================================
// QC Test DTOs
// ===================================================================

export interface QualityControlTestResponseDto {
  id: number;
  testName: string;
  testType?: string | null;
  machineId: number;
  updatedAt?: string | Date | null;
}

export interface CreateQualityControlTestDto {
  testName: string;
  testType?: string;
  machineId: number;
}

export interface UpdateQualityControlTestDto {
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
  expirationDate: string | Date;
  targetValue?: number | null;
  mean?: number | null;
  standardDeviation?: number | null;
  upperControlLimit?: number | null;
  lowerControlLimit?: number | null;
  upperWarningLimit?: number | null;
  lowerWarningLimit?: number | null;
  isActive: boolean;
  createdAt: string | Date;
  daysActive?: number;
  needsChecking?: boolean;
}

export interface CreateControlLotDto {
  testId: number;
  level: number;
  lotNumber: string;
  expirationDate: string | Date;
  targetValue?: number;
  mean?: number;
  standardDeviation?: number;
  upperControlLimit?: number;
  lowerControlLimit?: number;
  upperWarningLimit?: number;
  lowerWarningLimit?: number;
}

export interface UpdateControlLotDto {
  level?: number;
  expirationDate?: string | Date;
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

/**
 * Returned by GET /api/v1/control-lots?isActive=true
 * Extends the base lot DTO with embedded test context from a SQL JOIN,
 * eliminating the need to separately fetch /quality-control-tests on the frontend.
 */
export interface EnrichedControlLotResponseDto extends ControlLotResponseDto {
  /** Name of the parent QC test (from quality_control_tests JOIN) */
  testName: string;
  /** Category/type of the parent QC test */
  testType?: string | null;
  /** ID of the machine this test belongs to (from quality_control_tests JOIN) */
  machineId: number;
  /** Computed: number of days since lot was created */
  daysActive: number;
  /** Computed: true if lot has been active for ≥ 10 days */
  needsChecking: boolean;
}

export interface ControlLotInResultDto {
  id: number;
  testId: number;
  level: number;
  lotNumber: string;
  expirationDate: string | Date;
  targetValue?: number | null;
  mean?: number | null;
  standardDeviation?: number | null;
  upperControlLimit?: number | null;
  lowerControlLimit?: number | null;
  upperWarningLimit?: number | null;
  lowerWarningLimit?: number | null;
  isActive: boolean;
  createdAt: string | Date;
}

// ===================================================================
// QC Result DTOs
// ===================================================================

export interface QualityControlResultResponseDto {
  id: number;
  measuredValue: number;
  testDate: string | Date;
  status: QualityControlResultStatus;
  comments?: string | null;
  lotId: number;
  performedBy: number;
  zScore: number;
  violatedRule: string | null;
}

/**
 * Returned by GET /api/v1/quality-control-results (without lotId param).
 * Enriched with lot/test/machine context via server-side JOINs.
 * The frontend no longer needs to cross-reference separate lot and test fetches.
 */
export interface EnrichedQualityControlResultResponseDto extends QualityControlResultResponseDto {
  /** Lot details (from control_lots JOIN) */
  lotNumber: string;
  lotMean: number | null;
  lotSd: number | null;
  lotLevel: number;
  lowerControlLimit: number | null;
  upperControlLimit: number | null;
  /** Test + machine context (from quality_control_tests / machines JOIN) */
  testId: number;
  testName: string;
  machineId: number;
}

export interface QualityControlResultItemDto {
  lotId: number;
  measuredValue: number;
  comments?: string;
}

export interface CreateQualityControlResultDto {
  machineId: number;
  results: QualityControlResultItemDto[];
}

export interface QualityControlRunDto {
  id: number;
  machineId: number;
  testId: number;
  performedBy: number;
  runDate: string | Date;
}

export interface QualityControlRunResultResponseDto {
  id: number;
  measuredValue: number;
  zScore: number;
  violatedRule: string | null;
  status: QualityControlResultStatus;
  comments?: string | null;
  runId: number;
  lotId: number;
}

export interface QualityControlRunResponseDto {
  run: QualityControlRunDto;
  results: QualityControlRunResultResponseDto[];
}


export interface UpdateQualityControlResultDto {
  comments?: string;
}

export interface QualityControlResultDetailResponseDto {
  id: number;
  measuredValue: number;
  testDate: string | Date;
  status: QualityControlResultStatus;
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

export interface QualityControlResultsWithLotResponseDto {
  lot: LotSummaryDto | null;
  results: QualityControlResultResponseDto[];
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
  machineId?: number;
  testId?: number;
  createdAt?: string | Date | null;
  status: UserAlertStatus;
  seenAt?: string | Date | null;
  resolvedAt?: string | Date | null;
  resolutionNote?: string | null;
  machineName?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  testName?: string | null;
}

export type UserAlertStatus = 'UNSEEN' | 'SEEN' | 'RESOLVED';

export interface UserAlertStatusResponseDto {
  userId: number;
  alertId: number;
  status: UserAlertStatus;
  seenAt?: string | Date | null;
  resolvedAt?: string | Date | null;
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
