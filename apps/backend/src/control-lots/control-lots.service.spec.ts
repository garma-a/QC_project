import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { ControlLotsRepository } from './control-lots.repository';

describe('ControlLotsService', () => {
  let service: ControlLotsService;
  let mockRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepository = {
      findTestById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTestId: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlLotsService,
        { provide: ControlLotsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ControlLotsService>(ControlLotsService);
  });

  describe('create', () => {
    const newLotData = {
      testId: 1,
      lotNumber: 'LOT-HGB-2026-A',
      expirationDate: '2026-12-31',
      mean: 14.0,
      standardDeviation: 0.5,
      upperControlLimit: 15.5,
      lowerControlLimit: 12.5,
      upperWarningLimit: 15.0,
      lowerWarningLimit: 13.0,
    };

    it('should return the created control lot when test exists', async () => {
      mockRepository.findTestById.mockResolvedValue({
        id: 1,
        testName: 'Hemoglobin',
      });
      mockRepository.create.mockResolvedValue({
        id: 1,
        ...newLotData,
        expirationDate: new Date('2026-12-31'),
        isActive: true,
      });

      const result = await service.create(newLotData);

      expect(result.id).toBe(1);
      expect(result.lotNumber).toBe('LOT-HGB-2026-A');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when QC test does not exist', async () => {
      mockRepository.findTestById.mockResolvedValue(undefined);

      await expect(service.create(newLotData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(newLotData)).rejects.toThrow(
        `QC Test with ID ${newLotData.testId} not found`,
      );
    });
  });

  describe('findAll', () => {
    it('should return all control lots', async () => {
      const lots = [
        { id: 1, lotNumber: 'LOT-HGB-2026-A' },
        { id: 2, lotNumber: 'LOT-WBC-2026-A' },
      ];
      mockRepository.findAll.mockResolvedValue(lots);

      const result = await service.findAll();

      expect(result).toEqual(lots);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no lots exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the control lot when found', async () => {
      const lot = { id: 1, lotNumber: 'LOT-HGB-2026-A', mean: 14.0 };
      mockRepository.findById.mockResolvedValue(lot);

      const result = await service.findOne(1);

      expect(result).toEqual(lot);
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99)).rejects.toThrow(
        'Control lot with ID 99 not found',
      );
    });
  });

  describe('findByTestId', () => {
    it('should return all lots for a specific test', async () => {
      const lots = [
        { id: 1, testId: 1, lotNumber: 'LOT-HGB-2026-A' },
        { id: 3, testId: 1, lotNumber: 'LOT-HGB-2026-B' },
      ];
      mockRepository.findByTestId.mockResolvedValue(lots);

      const result = await service.findByTestId(1);

      expect(result).toHaveLength(2);
      expect(result.every((lot) => lot.testId === 1)).toBe(true);
    });

    it('should return empty array when test has no lots', async () => {
      mockRepository.findByTestId.mockResolvedValue([]);

      const result = await service.findByTestId(999);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should return the updated control lot', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, mean: 14.0 });
      mockRepository.update.mockResolvedValue({ id: 1, mean: 14.5 });

      const result = await service.update(1, { mean: 14.5 });

      expect(result.mean).toBe(14.5);
    });

    it('should convert expiration date string to Date object', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1 });
      mockRepository.update.mockResolvedValue({
        id: 1,
        expirationDate: new Date('2027-06-30'),
      });

      const result = await service.update(1, { expirationDate: '2027-06-30' });

      expect(result.expirationDate).toEqual(new Date('2027-06-30'));
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.update(99, { mean: 14.5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should deactivate and return success message with the lot', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, isActive: true });
      mockRepository.deactivate.mockResolvedValue({ id: 1, isActive: false });

      const result = await service.remove(1);

      expect(result.message).toBe('Control lot deactivated successfully');
      expect(result.lot.isActive).toBe(false);
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
