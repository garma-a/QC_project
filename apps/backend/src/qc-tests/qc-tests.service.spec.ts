import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QcTestsService } from './qc-tests.service';
import { QcTestsRepository } from './qc-tests.repository';

describe('QcTestsService', () => {
  let service: QcTestsService;

  const mockQcTestsRepository = {
    getMachineById: jest.fn(),
    createQcTest: jest.fn(),
    getTestsByMachine: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcTestsService,
        { provide: QcTestsRepository, useValue: mockQcTestsRepository },
      ],
    }).compile();

    service = module.get<QcTestsService>(QcTestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const createDto = { machineId: 1, testName: 'Pressure Test', value: 42 };

    it('throws NotFoundException when machine does not exist', async () => {
      mockQcTestsRepository.getMachineById.mockResolvedValueOnce(undefined);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Cannot create test: Machine #${createDto.machineId} not found`,
      );
    });

    it('returns the created test when machine exists', async () => {
      mockQcTestsRepository.getMachineById.mockResolvedValueOnce({
        id: 1,
        name: 'Machine A',
      });
      mockQcTestsRepository.createQcTest.mockResolvedValueOnce({
        id: 99,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toEqual({ id: 99, ...createDto });
    });
  });

  describe('getTestsByMachine()', () => {
    const machineId = 5;

    it('throws NotFoundException when machine does not exist', async () => {
      mockQcTestsRepository.getMachineById.mockResolvedValueOnce(undefined);

      await expect(service.getTestsByMachine(machineId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTestsByMachine(machineId)).rejects.toThrow(
        `Machine #${machineId} not found`,
      );
    });

    it('returns an empty array when machine exists but has no tests', async () => {
      mockQcTestsRepository.getMachineById.mockResolvedValueOnce({
        id: machineId,
      });
      mockQcTestsRepository.getTestsByMachine.mockResolvedValueOnce([]);

      const result = await service.getTestsByMachine(machineId);

      expect(result).toEqual([]);
    });

    it('returns tests when machine exists and has tests', async () => {
      const mockTests = [
        { id: 1, machineId, testName: 'Pressure' },
        { id: 2, machineId, testName: 'Voltage' },
      ];
      mockQcTestsRepository.getMachineById.mockResolvedValueOnce({
        id: machineId,
      });
      mockQcTestsRepository.getTestsByMachine.mockResolvedValueOnce(mockTests);

      const result = await service.getTestsByMachine(machineId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockTests);
    });
  });
});
