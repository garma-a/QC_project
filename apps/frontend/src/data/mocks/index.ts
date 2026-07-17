import type { 
  MachineResponseDto, 
  ProfileResponseDto, 
  SectionResponseDto, 
  QualityControlTestResponseDto, 
  ControlLotResponseDto, 
  QualityControlResultResponseDto,
  AlertResponseDto,
  EnrichedQualityControlResultResponseDto,
  EnrichedControlLotResponseDto,
} from '@qc/shared';

export const mockProfile: ProfileResponseDto = {
  id: 1,
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@qc.local',
  role: 'ADMIN',
  phone: '123-456-7890',
  emailNotificationsEnabled: true,
  subscribeToAllSections: true,
  assignedSections: [{ id: 1, name: 'Main Lab', specialization: 'CHEMISTRY' }],
  createdAt: new Date().toISOString()
};

export const mockSections: SectionResponseDto[] = [
  {
    id: 1,
    name: 'Main Lab',
    location: 'Floor 1',
    specialization: 'CHEMISTRY',
    createdAt: new Date().toISOString()
  }
];

export const mockMachines: MachineResponseDto[] = [
  {
    id: 1,
    name: 'Cobas 6000',
    hospitalCode: 'C6K-01',
    sectionId: 1,
    currentStatus: 'IDLE',
    lastRunAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    specialization: 'CHEMISTRY'
  },
  {
    id: 2,
    name: 'Sysmex XN-1000',
    hospitalCode: 'SXN-01',
    sectionId: 1,
    currentStatus: 'IDLE',
    lastRunAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    specialization: 'HEMATOLOGY'
  }
];

export const mockQcTests: QualityControlTestResponseDto[] = [
  {
    id: 1,
    testName: 'Glucose',
    testType: 'CHEMISTRY',
    machineId: 1,
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    testName: 'WBC',
    testType: 'HEMATOLOGY',
    machineId: 2,
    updatedAt: new Date().toISOString()
  }
];

export const mockControlLots: EnrichedControlLotResponseDto[] = [
  {
    id: 1,
    testId: 1,
    testName: 'Glucose',
    testType: 'CHEMISTRY',
    machineId: 1,
    level: 1,
    lotNumber: 'L1-GLU-2023',
    expirationDate: new Date(Date.now() + 10000000000).toISOString(),
    targetValue: 100,
    mean: 100,
    standardDeviation: 5,
    upperControlLimit: 115,
    lowerControlLimit: 85,
    upperWarningLimit: 110,
    lowerWarningLimit: 90,
    isActive: true,
    createdAt: new Date().toISOString(),
    daysActive: 15,
    needsChecking: false
  }
];

export const mockAlerts: AlertResponseDto[] = [
  {
    id: 1,
    type: 'QC_FAILED',
    priority: 'HIGH',
    message: 'Glucose QC Failed Westgard Rule 1-3s',
    ruleViolated: '1-3s',
    suggestedSolution: 'Recalibrate and rerun',
    resultId: 1,
    machineId: 1,
    testId: 1,
    createdAt: new Date().toISOString(),
    status: 'UNSEEN',
    machineName: 'Cobas 6000',
    sectionId: 1,
    sectionName: 'Main Lab',
    testName: 'Glucose'
  }
];

const generateMachineHistory = () => {
  const history = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    // 3 tests per day for 30 days
    for (let j = 0; j < 3; j++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      date.setHours(8 + j * 4); // 8 AM, 12 PM, 4 PM

      // Generate a normal distribution around 100 with SD 5
      // Adding a slight trend or occasional outlier
      let value = 100 + (Math.random() + Math.random() + Math.random() - 1.5) * 5; 
      
      // Randomly make a few outliers
      if (Math.random() < 0.05) {
        value += (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 5);
      }

      const zScore = (value - 100) / 5;
      let status = 'PASS';
      let rule = null;

      if (Math.abs(zScore) >= 3) {
        status = 'FAIL';
        rule = '1-3s';
      } else if (Math.abs(zScore) >= 2) {
        status = 'WARNING';
        rule = '1-2s';
      }

      history.push({
        id: i * 3 + j + 1,
        measuredValue: value,
        testDate: date.toISOString(),
        status: status as any,
        comments: null,
        lotId: 1,
        performedBy: 1,
        zScore: zScore,
        violatedRule: rule,
        lotNumber: 'L1',
        lotMean: 100,
        lotSd: 5,
        lotLevel: 1,
        lowerControlLimit: 85,
        upperControlLimit: 115,
        testId: 1,
        testName: 'Glucose',
        machineId: 1,
        date: date.toISOString(),
        expectedRange: '85 - 115',
        level: 1
      });
    }
  }
  return history;
};

export const mockMachineHistory = generateMachineHistory();

// Reusing types from frontend BFF
export const mockDashboard = {
  machines: mockMachines.map(m => ({
    ...m,
    testsToday: 12,
    lastQC: { date: new Date().toISOString(), status: 'PASS' },
    tests: m.id === 1 ? [
      {
        id: '1',
        name: 'Glucose',
        category: 'Chemistry',
        code: 'GLU',
        unit: 'mg/dL',
        lowRange: 70,
        highRange: 140,
        lotId: 1,
        level: 1,
        lotNumber: 'L1',
        isActive: true,
        mean: 100,
        standardDeviation: 5
      }
    ] : []
  })),
  categories: [{ id: '1', name: 'Chemistry' }],
  qcHistory: mockMachineHistory
};

export const mockQcHistory = {
  results: mockMachineHistory.map(h => ({
    id: h.id.toString(),
    machineId: h.machineId.toString(),
    testName: h.testName,
    date: new Date(h.testDate).toLocaleString(),
    rawDate: h.testDate,
    performedBy: 'Admin User',
    numericResult: h.measuredValue,
    result: `${h.measuredValue.toFixed(1)} mg/dL`,
    expectedRange: h.expectedRange,
    status: h.status,
    notes: '',
    zScore: h.zScore,
    violatedRule: h.violatedRule || '',
    lotMean: h.lotMean,
    lotSd: h.lotSd
  })).reverse(), // newest first
  nextOffset: undefined
};

export const mockQcMachines = {
  machines: mockMachines.map(m => ({
    id: m.id,
    name: m.name,
    status: m.currentStatus,
    lastRunAt: m.lastRunAt,
    testsToday: 15,
    openAlerts: 0
  })),
  categories: [{ id: 1, name: 'Chemistry', machineCount: 1 }]
};
