import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { QcResultsRepository } from './qc-results.repository';

describe('QcResultsService', () => {
  let service: QcResultsService;
  let mockRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepository = {
      getLotById: jest.fn(),
      createQcResult: jest.fn(),
      updateQcResult: jest.fn(),
      getAllLotsTestsMachinesByLotId: jest.fn(),
      getResutsByLotId: jest.fn(),
      getResultAndLotByResultId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcResultsService,
        { provide: QcResultsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<QcResultsService>(QcResultsService);
  });

  describe('create', () => {
    const userId = 5;
    const lotWithStats = { id: 1, mean: 14.0, standardDevi: 0.5 };

    it('should create QC result with PASS status when z-score is within 2 SD', async () => {
      // z-score = (14.5 - 14.0) / 0.5 = 1.0 (PASS)
      const dto = { measuredValue: 14.5, lotId: 1, comments: 'Normal reading' };
      mockRepository.getLotById.mockResolvedValue(lotWithStats);
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'PASS', performedBy: userId },
      ]);

      const result = await service.create(dto, userId);

      expect(result.status).toBe('PASS');
    });

    it('should create QC result with WARNING status when z-score is between 2 and 3 SD', async () => {
      // z-score = (15.2 - 14.0) / 0.5 = 2.4 (WARNING)
      const dto = {
        measuredValue: 15.2,
        lotId: 1,
        comments: 'Elevated reading',
      };
      mockRepository.getLotById.mockResolvedValue(lotWithStats);
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'WARNING', performedBy: userId },
      ]);

      const result = await service.create(dto, userId);

      expect(result.status).toBe('WARNING');
    });

    it('should create QC result with FAIL status when z-score exceeds 3 SD', async () => {
      // z-score = (16.0 - 14.0) / 0.5 = 4.0 (FAIL)
      const dto = { measuredValue: 16.0, lotId: 1, comments: 'Out of control' };
      mockRepository.getLotById.mockResolvedValue(lotWithStats);
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      const result = await service.create(dto, userId);

      expect(result.status).toBe('FAIL');
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      const dto = { measuredValue: 14.5, lotId: 999, comments: '' };
      mockRepository.getLotById.mockResolvedValue(undefined);

      await expect(service.create(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(dto, userId)).rejects.toThrow(
        'Control lot not found',
      );
    });

    it('should throw BadRequestException when lot is missing statistical values', async () => {
      const dto = { measuredValue: 14.5, lotId: 1, comments: '' };
      mockRepository.getLotById.mockResolvedValue({
        id: 1,
        mean: null,
        standardDevi: 0.5,
      });

      await expect(service.create(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, userId)).rejects.toThrow(
        'Control lot is missing required statistical values',
      );
    });
  });

  describe('findAll', () => {
    it('should return lot information with test and machine names', async () => {
      const lot = {
        id: 1,
        lotNumber: 'LOT-HGB-2026',
        mean: 14.0,
        standardDevi: 0.5,
        upperControlLimit: 15.5,
        lowerControlLimit: 12.5,
        upperWarningLimit: 15.0,
        lowerWarningLimit: 13.0,
      };
      mockRepository.getLotById.mockResolvedValue(lot);
      mockRepository.getAllLotsTestsMachinesByLotId.mockResolvedValue({
        ...lot,
        qc_tests: { testName: 'Hemoglobin' },
        machines: { name: 'Sysmex XN-1000' },
      });

      const result = await service.findAll(1);

      expect(result.lot.testName).toBe('Hemoglobin');
      expect(result.lot.machineName).toBe('Sysmex XN-1000');
      expect(result.lot.mean).toBe(14.0);
    });

    it('should throw NotFoundException when lot does not exist', async () => {
      mockRepository.getLotById.mockResolvedValue(undefined);

      await expect(service.findAll(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return QC result with calculated z-score', async () => {
      // z-score = (15.0 - 14.0) / 0.5 = 2.0
      mockRepository.getResultAndLotByResultId.mockResolvedValue({
        qc_results: { id: 1, measuredValue: 15.0, status: 'WARNING' },
        control_lots: { mean: 14.0, standardDevi: 0.5 },
      });

      const result = await service.findOne(1);

      expect(result.zScore).toBe(2);
    });

    it('should throw NotFoundException when QC result does not exist', async () => {
      mockRepository.getResultAndLotByResultId.mockResolvedValue(undefined);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('QC Result not found');
    });

    it('should throw BadRequestException when associated lot is missing stats', async () => {
      mockRepository.getResultAndLotByResultId.mockResolvedValue({
        qc_results: { id: 1, measuredValue: 15.0 },
        control_lots: { mean: null, standardDevi: null },
      });

      await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update comments and return the full result', async () => {
      const updateDto = { comments: 'Recalibration performed' };
      mockRepository.updateQcResult.mockResolvedValue({
        id: 1,
        comments: 'Recalibration performed',
      });
      jest.spyOn(service, 'findOne').mockResolvedValue({
        qc_results: {
          id: 1,
          measuredValue: 14.5,
          comments: 'Recalibration performed',
        },
        control_lots: { mean: 14.0, standardDevi: 0.5 },
        zScore: 1,
      } as any);

      const result = await service.update(1, updateDto);

      expect(result.zScore).toBe(1);
    });

    it('should throw NotFoundException when QC result does not exist', async () => {
      mockRepository.updateQcResult.mockResolvedValue(undefined);

      await expect(service.update(999, { comments: 'test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
