import bigData from '../data/big_data.json';
import { QCDataPoint } from './westgardRules';

// Type definition for the raw data structure
interface RawQCRecord {
  SEQNO: number;
  SAMPLEREF: number;
  EQPTYPE: string;
  EQPCODE: number;
  TESTCODE: number;
  TESTRESULT: number | string;
  RESULTED: string;
  TESTDATE: string;
  QC: string;
  PATID: string;
  HOSP_COD: number;
  LABNO: string;
  NEWRECORD: string;
}

interface BigDataStructure {
  [machineId: string]: {
    [testCode: string]: RawQCRecord[];
  };
}

const data = bigData as unknown as BigDataStructure;

export function getAvailableMachines(): string[] {
  return Object.keys(data);
}

export function getAvailableTests(machineId: string): string[] {
  if (!data[machineId]) return [];
  return Object.keys(data[machineId]);
}

export function getQCData(machineId: string, testCode: string): QCDataPoint[] {
  if (!data[machineId] || !data[machineId][testCode]) return [];

  const rawRecords = data[machineId][testCode];

  // Group by date (ignoring time)
  const groupedByDate: { [date: string]: number[] } = {};

  rawRecords.forEach(record => {
    const val = parseFloat(record.TESTRESULT as string);
    if (!isNaN(val)) {
      // Extract just the date part "MM/DD/YYYY"
      const datePart = record.TESTDATE.split(' ')[0];
      if (!groupedByDate[datePart]) {
        groupedByDate[datePart] = [];
      }
      groupedByDate[datePart].push(val);
    }
  });

  // Create QCDataPoints with averaged values
  return Object.entries(groupedByDate)
    .map(([date, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      return {
        date,
        value: avg,
        testName: `Test ${testCode}`,
        qcLevel: 'Unknown'
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
