import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QcTestsService } from './qc-tests.service';
import { DatabaseService } from '@/database/database.service';

// ---------------------------------------------------------------------------
// Shared mock state — reset before every test
// ---------------------------------------------------------------------------
let mockMachineRows: unknown[] = [];
let mockQcTestRows: unknown[] = [];
let mockInsertedRow: unknown = {};

// Select chain: supports .from().where().limit() and plain await (no .limit)
const makeSelectFluent = (): any => ({
  from:  () => makeSelectFluent(),
  where: () => makeSelectFluent(),
  limit: (n: number) => Promise.resolve(mockMachineRows.slice(0, n)),
  // Awaiting without .limit() resolves to qcTest rows
  then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(mockQcTestRows).then(resolve, reject),
});

// Insert chain: supports .values().returning()
const makeInsertFluent = (): any => ({
  values:    () => makeInsertFluent(),
  returning: () => Promise.resolve([mockInsertedRow]),
});

// DatabaseService mock — select and insert use separate chains
const mockDatabaseService = {
  db: {
    select: () => makeSelectFluent(),
    insert: () => makeInsertFluent(),
  },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('QcTestsService', () => {
  let service: QcTestsService;

  beforeEach(async () => {
    // Reset state
    mockMachineRows = [];
    mockQcTestRows = [];
    mockInsertedRow = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcTestsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<QcTestsService>(QcTestsService);
  });

  // -------------------------------------------------------------------------
  // Existence check
  // -------------------------------------------------------------------------
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create()', () => {
    const createDto = { machineId: 1, testName: 'Pressure Test', value: 42 };

    it('throws NotFoundException when machine does not exist', async () => {
      mockMachineRows = []; // no machine

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        `Cannot create test: Machine #${createDto.machineId} not found`,
      );
    });

    it('inserts and returns the new test when machine exists', async () => {
      mockMachineRows = [{ id: 1, name: 'Machine A' }];
      mockInsertedRow = { id: 99, ...createDto };

      const result = await service.create(createDto);

      expect(result).toEqual({ id: 99, ...createDto });
    });
  });

  // -------------------------------------------------------------------------
  // getTestsByMachine()
  // -------------------------------------------------------------------------
  describe('getTestsByMachine()', () => {
    const machineId = 5;

    it('throws NotFoundException when machine does not exist', async () => {
      mockMachineRows = [];

      await expect(service.getTestsByMachine(machineId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTestsByMachine(machineId)).rejects.toThrow(
        `Machine #${machineId} not found`,
      );
    });

    it('returns an empty array when machine exists but has no tests', async () => {
      mockMachineRows = [{ id: machineId }];
      mockQcTestRows = [];

      const result = await service.getTestsByMachine(machineId);

      expect(result).toEqual([]);
    });

    it('returns tests when machine exists and has tests', async () => {
      mockMachineRows = [{ id: machineId }];
      mockQcTestRows = [
        { id: 1, machineId, testName: 'Pressure' },
        { id: 2, machineId, testName: 'Voltage' },
      ];

      const result = await service.getTestsByMachine(machineId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockQcTestRows);
    });
  });
});