export interface UserSchema {
  id: string;
  username: string;
  password: string;
  role: "admin" | "doctor";
  fullName: string;
  email?: string;
  createdAt: string;
  profileImage?: string;
  isActive?: boolean;
  lastActiveAt?: string;
}

export interface CategorySchema {
  id: string;
  name: string;
}

export interface MachineTestSchema {
  code: string | number;
  name: string;
  unit: string;
  lowRange: number;
  highRange: number;
  category: string;
}

export interface QCTestSchema {
  id: string;
  machineId: string;
  testName: string;
  testCode: string;
  date: string;
  performedBy: string;
  result: string;
  expectedRange: string;
  status: "pass" | "fail";
  notes: string | null;
  qcLevel: string;
  numericResult?: number;
}

export interface MachineSchema {
  id: string;
  name: string;
  model: string;
  category: string;
  status: "operational" | "warning" | "error";
  location: string;
  lastMaintenance: string;
  testsToday: number;
  equipmentCode: number;
  tests: MachineTestSchema[];
  lastQC: {
    date: string;
    status: "pass" | "fail" | "warning" | "error";
  };
}

export interface MachineErrorSchema {
  id: string;
  machineId: string;
  machineName: string;
  machineCategory: "chemistry" | "hematology" | "immunology";
  errorType: string;
  severity: "critical" | "warning" | "info";
  description: string;
  timestamp: string;
  possibleCauses: string[];
  suggestedSolutions: string[];
  affectedTests?: string[];
  errorCode?: string;
  status: "active" | "resolved";
  relatedErrorCount: number;
  primaryTestName?: string;
  primaryTestCode?: string;
  lowRange?: number;
  highRange?: number;
  units?: string;
  recentValues?: number[];
  errorPattern?: "systematic" | "random";
  patternExplanation?: string;
  westgardRule?: string;
  aiInsight?: string;
}
