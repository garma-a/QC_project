import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QcTestsController } from './qc-tests.controller';
import { QcTestsService } from './qc-tests.service';

// ---------------------------------------------------------------------------
// Mock service — mirrors real method signatures
// ---------------------------------------------------------------------------
const mockQcTestsService = {
  create: jest.fn(),
  getTestsByMachine: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('QcTestsController', () => {
  let controller: QcTestsController;

  beforeEach(async () => {
    // Reset all mocks between tests
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QcTestsController],
      providers: [
        { provide: QcTestsService, useValue: mockQcTestsService },
      ],
    }).compile();

    controller = module.get<QcTestsController>(QcTestsController);
  });

  // -------------------------------------------------------------------------
  // Existence check
  // -------------------------------------------------------------------------
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------
  describe('create()', () => {
    const createDto = { machineId: 1, testName: 'Pressure Test', value: 42 };

    it('returns the created test', async () => {
      const created = { id: 99, ...createDto };
      mockQcTestsService.create.mockResolvedValue(created);

      const result = await controller.create(createDto);

      expect(mockQcTestsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(created);
    });

    it('propagates NotFoundException when machine is not found', async () => {
      mockQcTestsService.create.mockRejectedValue(
        new NotFoundException(`Cannot create test: Machine #${createDto.machineId} not found`),
      );

      await expect(controller.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // getTestsByMachine()
  // -------------------------------------------------------------------------
  describe('getTestsByMachine()', () => {
    const machineId = 5;

    it('returns tests for a valid machine', async () => {
      const tests = [
        { id: 1, machineId, testName: 'Pressure' },
        { id: 2, machineId, testName: 'Voltage' },
      ];
      mockQcTestsService.getTestsByMachine.mockResolvedValue(tests);

      const result = await controller.findByMachine(machineId);

      expect(mockQcTestsService.getTestsByMachine).toHaveBeenCalledWith(machineId);
      expect(result).toEqual(tests);
    });

    it('returns an empty array when machine has no tests', async () => {
      mockQcTestsService.getTestsByMachine.mockResolvedValue([]);

      const result = await controller.findByMachine(machineId);

      expect(result).toEqual([]);
    });

    it('propagates NotFoundException when machine is not found', async () => {
      mockQcTestsService.getTestsByMachine.mockRejectedValue(
        new NotFoundException(`Machine #${machineId} not found`),
      );

      await expect(controller.findByMachine(machineId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});