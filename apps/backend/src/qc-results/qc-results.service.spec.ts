import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QcResultsService } from './qc-results.service';
import { QcResultsRepository } from './qc-results.repository';
import { AlertsService } from '@/alerts/alerts.service';
import { UsersRepository } from '@/users/users.repository';

describe('QcResultsService', () => {
  let service: QcResultsService;
  let mockRepository: Record<string, jest.Mock>;
  let mockAlertsService: Record<string, jest.Mock>;
  let mockUsersRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepository = {
      getLotById: jest.fn(),
      getSectionIdByLotId: jest.fn(),
      createQcRun: jest.fn(),
      updateQcResult: jest.fn(),
      getLotTestMachineByLotId: jest.fn(),
      getResultsByLotId: jest.fn(),
      getResultAndLotByResultId: jest.fn(),
      getRecentZScoresByLotId: jest.fn(),
    };

    mockAlertsService = {
      createForUsers: jest.fn(),
    };

    mockUsersRepository = {
      getUserIdsBySectionId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcResultsService,
        { provide: QcResultsRepository, useValue: mockRepository },
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<QcResultsService>(QcResultsService);
  });

  describe('create', () => {
    const userId = 5;
    const lotWithStats = { id: 1, mean: 14.0, standardDeviation: 0.5, lotNumber: 'LOT-1' };
    const machineId = 9;
    // Helper to build the new Run-shaped DTO
    const buildDto = (measuredValue: number, lotId = 1) => ({
      machineId,
      results: [{ lotId, measuredValue, comments: 'test' }],
    });
    // Helper to build the mock return value of createQcRun
    const buildRunResult = (status: string, id = 1) => ({
      run: { id: 100, machineId, performedBy: userId, runDate: new Date() },
      results: [{ id, status, zScore: 0, violatedRule: null, lotId: 1, measuredValue: 14.5 }],
    });

    beforeEach(() => {
      // Arrange - common setup
      mockRepository.getLotById.mockResolvedValue(lotWithStats);
      mockRepository.getSectionIdByLotId.mockResolvedValue(10);
      mockUsersRepository.getUserIdsBySectionId.mockResolvedValue([5, 7]);
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([]);
    });

    it('should create a QC run with PASS status when z-score is within 2 SD', async () => {
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('PASS'));

      const result = await service.create(buildDto(14.5), userId);

      expect(result.results[0].status).toBe('PASS');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ status: 'PASS', violatedRule: null })]),
      );
      expect(mockAlertsService.createForUsers).not.toHaveBeenCalled();
    });

    it('should create a QC run with WARNING status (1_2s) when z-score exceeds 2 SD', async () => {
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('WARNING'));

      const result = await service.create(buildDto(15.2), userId);

      expect(result.results[0].status).toBe('WARNING');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ status: 'WARNING', violatedRule: '1_2s' })]),
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create a QC run with FAIL status (1_3s) when z-score exceeds 3 SD', async () => {
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('FAIL'));

      const result = await service.create(buildDto(16.0), userId); // z-score = +4.0

      expect(result.results[0].status).toBe('FAIL');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ status: 'FAIL', violatedRule: '1_3s' })]),
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create a QC run with FAIL status (2_2s) when two consecutive z-scores exceed 2 SD', async () => {
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([2.1]);
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('FAIL'));

      const result = await service.create(buildDto(15.1), userId);

      expect(result.results[0].status).toBe('FAIL');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ violatedRule: '2_2s' })]),
      );
    });

    it('should create a QC run with FAIL status (3_1s) when three consecutive z-scores exceed 1 SD', async () => {
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([1.3, 1.4]);
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('FAIL'));

      const result = await service.create(buildDto(14.6), userId); // z-score = +1.2

      expect(result.results[0].status).toBe('FAIL');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ violatedRule: '3_1s' })]),
      );
    });

    it('should create a QC run with FAIL status (7_T) when 7 consecutive z-scores trend upwards', async () => {
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([0.6, 0.5, 0.4, 0.3, 0.2, 0.1]);
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('FAIL'));

      const result = await service.create(buildDto(14.35), userId); // z-score = +0.7

      expect(result.results[0].status).toBe('FAIL');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ violatedRule: '7_T' })]),
      );
    });

    it('should create a QC run with FAIL status (6_x) when 6 consecutive z-scores fall on the same side', async () => {
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([0.5, 0.3, 0.6, 0.2, 0.8]);
      mockRepository.createQcRun.mockResolvedValue(buildRunResult('FAIL'));

      const result = await service.create(buildDto(14.2), userId); // z-score = +0.4

      expect(result.results[0].status).toBe('FAIL');
      expect(mockRepository.createQcRun).toHaveBeenCalledWith(
        machineId, userId,
        expect.arrayContaining([expect.objectContaining({ violatedRule: '6_x' })]),
      );
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      mockRepository.getLotById.mockResolvedValue(undefined);

      await expect(service.create(buildDto(14.5, 999), userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when lot is missing statistical values', async () => {
      mockRepository.getLotById.mockResolvedValue({ id: 1, mean: null, standardDeviation: 0.5, lotNumber: 'LOT-1' });

      await expect(service.create(buildDto(14.5), userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(buildDto(14.5), userId)).rejects.toThrow(
        'is missing required statistical values',
      );
    });
  });

  describe('findAll', () => {
    it('should return lot information with test and machine names', async () => {
      const lot = {
        id: 1,
        lotNumber: 'LOT-HGB-2026',
        mean: 14.0,
        standardDeviation: 0.5,
        upperControlLimit: 15.5,
        lowerControlLimit: 12.5,
        upperWarningLimit: 15.0,
        lowerWarningLimit: 13.0,
      };
      mockRepository.getLotById.mockResolvedValue(lot);
      mockRepository.getLotTestMachineByLotId.mockResolvedValue({
        ...lot,
        qc_tests: { testName: 'Hemoglobin' },
        machines: { name: 'Sysmex XN-1000' },
      });
      mockRepository.getResultsByLotId.mockResolvedValue([]);

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
    it('should return QC result with stored z-score and violatedRule', async () => {
      mockRepository.getResultAndLotByResultId.mockResolvedValue({
        qc_results: { 
          id: 1, 
          measuredValue: 15.0, 
          status: 'WARNING',
          zScore: 2.0,
          violatedRule: '1_2s'
        },
        control_lots: { mean: 14.0, standardDeviation: 0.5 },
      });

      const result = await service.findOne(1);

      expect(result.zScore).toBe(2.0);
      expect(result.violatedRule).toBe('1_2s');
    });

    it('should throw NotFoundException when QC result does not exist', async () => {
      mockRepository.getResultAndLotByResultId.mockResolvedValue(undefined);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('QC Result not found');
    });

    it('should throw BadRequestException when associated lot is missing stats', async () => {
      mockRepository.getResultAndLotByResultId.mockResolvedValue({
        qc_results: { id: 1, measuredValue: 15.0 },
        control_lots: { mean: null, standardDeviation: null },
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
        control_lots: { mean: 14.0, standardDeviation: 0.5 },
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
