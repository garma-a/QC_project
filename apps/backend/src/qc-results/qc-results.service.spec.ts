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
      createQcResult: jest.fn(),
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
    const lotWithStats = { id: 1, mean: 14.0, standardDeviation: 0.5 };
    const baseDto = { lotId: 1, comments: 'test' };

    beforeEach(() => {
      // Arrange - common setup
      mockRepository.getLotById.mockResolvedValue(lotWithStats);
      mockRepository.getSectionIdByLotId.mockResolvedValue(10);
      mockUsersRepository.getUserIdsBySectionId.mockResolvedValue([5, 7]);
    });

    it('should create QC result with PASS status when z-score is within 2 SD', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 14.5 }; // z-score = +1.0
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([]);
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'PASS', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('PASS');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'PASS', userId, 1.0, null,
      );
      expect(mockAlertsService.createForUsers).not.toHaveBeenCalled();
    });

    it('should create QC result with WARNING status (1_2s) when z-score exceeds 2 SD', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 15.2 };
      const expectedZScore = (dto.measuredValue - lotWithStats.mean) / lotWithStats.standardDeviation;
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([]);
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'WARNING', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('WARNING');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'WARNING', userId, expectedZScore, '1_2s',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create QC result with FAIL status (1_3s) when z-score exceeds 3 SD', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 16.0 }; // z-score = +4.0
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([]);
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'FAIL', userId, 4.0, '1_3s',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create QC result with FAIL status (2_2s) when two consecutive z-scores exceed 2 SD', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 15.1 };
      const expectedZScore = (dto.measuredValue - lotWithStats.mean) / lotWithStats.standardDeviation;
      // previous z-score was +2.1, which triggers the 2_2s rule
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([2.1]); 
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'FAIL', userId, expectedZScore, '2_2s',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create QC result with FAIL status (2of3_2s) when two out of three consecutive z-scores exceed 2 SD', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 15.1 }; // z-score = +2.2
      const expectedZScore = (dto.measuredValue - lotWithStats.mean) / lotWithStats.standardDeviation;
      // History: [previous_z, older_z]. The current is +2.2, previous is +1.5, older is +2.1.
      // This means 2 out of the last 3 points are > +2.0
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([1.5, 2.1]); 
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'FAIL', userId, expectedZScore, '2of3_2s',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create QC result with FAIL status (3_1s) when three consecutive z-scores exceed 1 SD', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 14.6 }; // z-score = +1.2
      const expectedZScore = (dto.measuredValue - lotWithStats.mean) / lotWithStats.standardDeviation;
      // History: both must be > 1.0 to complete the 3 consecutive points
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([1.3, 1.4]); 
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'FAIL', userId, expectedZScore, '3_1s',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create QC result with FAIL status (7_T) when 7 consecutive z-scores trend upwards', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 14.35 }; // z-score = +0.7
      const expectedZScore = (dto.measuredValue - lotWithStats.mean) / lotWithStats.standardDeviation;
      // History (newest first). To make 7 points trending UP, history must be strictly decreasing.
      // Keep them all under 1.0 to avoid triggering the 3_1s rule!
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([0.6, 0.5, 0.4, 0.3, 0.2, 0.1]); 
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'FAIL', userId, expectedZScore, '7_T',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should create QC result with FAIL status (6_x) when 6 consecutive z-scores fall on the same side of the mean', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 14.2 }; // z-score = +0.4
      const expectedZScore = (dto.measuredValue - lotWithStats.mean) / lotWithStats.standardDeviation;
      // History: 5 previous z-scores that are > 0.
      mockRepository.getRecentZScoresByLotId.mockResolvedValue([0.5, 0.3, 0.6, 0.2, 0.8]); 
      mockRepository.createQcResult.mockResolvedValue([
        { id: 1, ...dto, status: 'FAIL', performedBy: userId },
      ]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(mockRepository.createQcResult).toHaveBeenCalledWith(
        dto, 'FAIL', userId, expectedZScore, '6_x',
      );
      expect(mockAlertsService.createForUsers).toHaveBeenCalled();
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 14.5, lotId: 999 };
      mockRepository.getLotById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto, userId)).rejects.toThrow('Control lot not found');
    });

    it('should throw BadRequestException when lot is missing statistical values', async () => {
      // Arrange
      const dto = { ...baseDto, measuredValue: 14.5 };
      mockRepository.getLotById.mockResolvedValue({
        id: 1,
        mean: null,
        standardDeviation: 0.5,
      });

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
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
