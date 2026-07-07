import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QualityControlTestsService } from './quality-control-tests.service';
import { QualityControlTestsRepository } from './quality-control-tests.repository';

describe('QualityControlTestsService', () => {
  let service: QualityControlTestsService;

  const mockQualityControlTestsRepository = {
    getMachineById: jest.fn(),
    createQualityControlTest: jest.fn(),
    getTestsByMachine: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityControlTestsService,
        { provide: QualityControlTestsRepository, useValue: mockQualityControlTestsRepository },
      ],
    }).compile();

    service = module.get<QualityControlTestsService>(QualityControlTestsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const createDto = { machineId: 1, testName: 'Pressure Test', value: 42 };

    it('throws NotFoundException when machine does not exist', async () => {
      mockQualityControlTestsRepository.getMachineById.mockResolvedValueOnce(undefined);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Cannot create test: Machine #${createDto.machineId} not found`,
      );
    });

    it('returns the created test when machine exists', async () => {
      mockQualityControlTestsRepository.getMachineById.mockResolvedValueOnce({
        id: 1,
        name: 'Machine A',
      });
      mockQualityControlTestsRepository.createQualityControlTest.mockResolvedValueOnce({
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
      mockQualityControlTestsRepository.getMachineById.mockResolvedValueOnce(undefined);

      await expect(service.getTestsByMachine(machineId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTestsByMachine(machineId)).rejects.toThrow(
        `Machine #${machineId} not found`,
      );
    });

    it('returns an empty array when machine exists but has no tests', async () => {
      mockQualityControlTestsRepository.getMachineById.mockResolvedValueOnce({
        id: machineId,
      });
      mockQualityControlTestsRepository.getTestsByMachine.mockResolvedValueOnce([]);

      const result = await service.getTestsByMachine(machineId);

      expect(result).toEqual([]);
    });

    it('returns tests when machine exists and has tests', async () => {
      const mockTests = [
        { id: 1, machineId, testName: 'Pressure' },
        { id: 2, machineId, testName: 'Voltage' },
      ];
      mockQualityControlTestsRepository.getMachineById.mockResolvedValueOnce({
        id: machineId,
      });
      mockQualityControlTestsRepository.getTestsByMachine.mockResolvedValueOnce(mockTests);

      const result = await service.getTestsByMachine(machineId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockTests);
    });
  });
});
