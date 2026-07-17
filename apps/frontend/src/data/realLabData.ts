// Real laboratory data structure based on actual lab machine output

export interface TestDefinition {
  code: string;
  name: string;
  unit: string;
  lowRange: number;
  highRange: number;
  category: string;
}

export interface QCRecord {
  SEQNO: number;
  SAMPLEREF: number;
  EQPTYPE: string;
  EQPCODE: number;
  TESTCODE: string | number;
  TESTRESULT: number | string;
  RESULTED: string;
  TESTDATE: string;
  QC: string;
  PATID: string;
  HOSP_COD: number;
  LABNO: string;
  NEWRECORD: string;
}

// Test definitions by machine type
export const testDefinitions: Record<number, TestDefinition[]> = {
  // Machine 9: Immunoassay/Hormones Analyzer
  9: [
    { code: '90', name: 'TSH (Thyroid Stimulating Hormone)', unit: 'mIU/L', lowRange: 0.4, highRange: 4.0, category: 'Thyroid Function' },
    { code: '227', name: 'Vitamin B12', unit: 'pg/mL', lowRange: 200, highRange: 900, category: 'Vitamins' },
    { code: '171', name: 'Folate (Folic Acid)', unit: 'ng/mL', lowRange: 2.7, highRange: 17.0, category: 'Vitamins' },
    { code: '222', name: 'Ferritin', unit: 'ng/mL', lowRange: 12, highRange: 300, category: 'Iron Studies' },
  ],

  // Machine 12: Chemistry Analyzer
  12: [
    { code: '42', name: 'Glucose', unit: 'mg/dL', lowRange: 70, highRange: 100, category: 'Glucose' },
    { code: '51', name: 'BUN (Blood Urea Nitrogen)', unit: 'mg/dL', lowRange: 7, highRange: 20, category: 'Kidney Function' },
    { code: '41', name: 'Creatinine', unit: 'mg/dL', lowRange: 0.7, highRange: 1.3, category: 'Kidney Function' },
    { code: '44', name: 'BUN/Creatinine Ratio', unit: 'Ratio', lowRange: 10, highRange: 20, category: 'Kidney Function' },
  ],

  // Machine 10: Hematology Analyzer
  10: [
    { code: 'WBC', name: 'White Blood Cell Count', unit: 'x10³/µL', lowRange: 4.0, highRange: 11.0, category: 'Complete Blood Count' },
    { code: 'RBC', name: 'Red Blood Cell Count', unit: 'x10⁶/µL', lowRange: 4.2, highRange: 5.9, category: 'Complete Blood Count' },
    { code: 'HGB', name: 'Hemoglobin', unit: 'g/dL', lowRange: 12.0, highRange: 16.0, category: 'Complete Blood Count' },
    { code: 'HCT', name: 'Hematocrit', unit: '%', lowRange: 36.0, highRange: 48.0, category: 'Complete Blood Count' },
    { code: 'MCV', name: 'Mean Corpuscular Volume', unit: 'fL', lowRange: 80.0, highRange: 100.0, category: 'Red Cell Indices' },
    { code: 'MCH', name: 'Mean Corpuscular Hemoglobin', unit: 'pg', lowRange: 27.0, highRange: 33.0, category: 'Red Cell Indices' },
    { code: 'MCHC', name: 'Mean Corpuscular Hemoglobin Concentration', unit: 'g/dL', lowRange: 32.0, highRange: 36.0, category: 'Red Cell Indices' },
    { code: 'PLT', name: 'Platelet Count', unit: 'x10³/µL', lowRange: 150, highRange: 400, category: 'Complete Blood Count' },
    { code: 'RDW-CV', name: 'Red Cell Distribution Width', unit: '%', lowRange: 11.5, highRange: 14.5, category: 'Red Cell Indices' },
    { code: 'RDW-SD', name: 'RDW Standard Deviation', unit: 'fL', lowRange: 39.0, highRange: 46.0, category: 'Red Cell Indices' },
    { code: 'MPV', name: 'Mean Platelet Volume', unit: 'fL', lowRange: 7.5, highRange: 11.5, category: 'Platelet Indices' },
    { code: 'PDW', name: 'Platelet Distribution Width', unit: 'fL', lowRange: 9.0, highRange: 17.0, category: 'Platelet Indices' },
    { code: 'PCT', name: 'Plateletcrit', unit: '%', lowRange: 0.15, highRange: 0.40, category: 'Platelet Indices' },
    { code: 'P-LCR', name: 'Platelet Large Cell Ratio', unit: '%', lowRange: 15.0, highRange: 35.0, category: 'Platelet Indices' },
    { code: 'NEUT%', name: 'Neutrophils Percentage', unit: '%', lowRange: 40.0, highRange: 75.0, category: 'Differential Count' },
    { code: 'LYMPH%', name: 'Lymphocytes Percentage', unit: '%', lowRange: 20.0, highRange: 45.0, category: 'Differential Count' },
    { code: 'MONO%', name: 'Monocytes Percentage', unit: '%', lowRange: 2.0, highRange: 10.0, category: 'Differential Count' },
    { code: 'EO%', name: 'Eosinophils Percentage', unit: '%', lowRange: 1.0, highRange: 6.0, category: 'Differential Count' },
    { code: 'BASO%', name: 'Basophils Percentage', unit: '%', lowRange: 0.0, highRange: 2.0, category: 'Differential Count' },
    { code: 'NEUT#', name: 'Neutrophils Absolute', unit: 'x10³/µL', lowRange: 1.5, highRange: 7.0, category: 'Differential Count' },
    { code: 'LYMPH#', name: 'Lymphocytes Absolute', unit: 'x10³/µL', lowRange: 1.0, highRange: 4.0, category: 'Differential Count' },
    { code: 'MONO#', name: 'Monocytes Absolute', unit: 'x10³/µL', lowRange: 0.2, highRange: 1.0, category: 'Differential Count' },
    { code: 'EO#', name: 'Eosinophils Absolute', unit: 'x10³/µL', lowRange: 0.0, highRange: 0.5, category: 'Differential Count' },
    { code: 'BASO#', name: 'Basophils Absolute', unit: 'x10³/µL', lowRange: 0.0, highRange: 0.2, category: 'Differential Count' },
  ],
};

// QC Control Levels
export const qcLevels: Record<string, { name: string; description: string }> = {
  'QC01': { name: 'Normal Level Control', description: 'Normal physiological range' },
  'QC02': { name: 'Level 1 Control', description: 'Low-normal range control' },
  'QC03': { name: 'Level 2 Control', description: 'High-normal range control' },
  'QC05': { name: 'Level 3 Control', description: 'Pathological range control' },
  'PC': { name: 'Process Control', description: 'System process control' },
  'XbarM1': { name: 'X-bar Mean Control 1', description: 'Statistical process control - Mean' },
  'XbarM2': { name: 'X-bar Mean Control 2', description: 'Statistical process control - Mean' },
  'RIQAS 7': { name: 'RIQAS Level 7', description: 'External quality control sample' },
  'RIQAS 8': { name: 'RIQAS Level 8', description: 'External quality control sample' },
  'RIQAS 9': { name: 'RIQAS Level 9', description: 'External quality control sample' },
};
