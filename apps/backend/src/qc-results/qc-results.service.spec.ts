import { Test, TestingModule } from '@nestjs/testing';
import { QcResultsService } from './qc-results.service';
import { DatabaseService } from '@/database/database.service';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('QcResultsService', () => {
  let service: QcResultsService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      query: {
        controlLots: {
          findFirst: jest.fn(),
        },
        qcResults: {
          findFirst: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QcResultsService,
        {
          provide: DatabaseService,
          useValue: { db: dbMock },
        },
      ],
    }).compile();

    service = module.get<QcResultsService>(QcResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateQcResultDto = {
      measuredValue: 14.5,
      lotId: 1,
      comments: 'Test run',
    };
    const userId = 5;

    it('should calculate PASS status and create a QC result', async () => {
      // Arrange
      // 14.5 against mean 14.0, SD 0.5 => z-score = 1.0 (PASS)
      dbMock.where.mockResolvedValueOnce([{ id: 1, mean: 14.0, standardDevi: 0.5 }]);
      dbMock.returning.mockResolvedValueOnce([{
        id: 10,
        ...dto,
        status: 'PASS',
        performedBy: userId,
      }]);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.from).toHaveBeenCalled();
      expect(dbMock.insert).toHaveBeenCalled();
      expect(dbMock.values).toHaveBeenCalledWith({
        measuredValue: 14.5,
        status: 'PASS',
        comments: 'Test run',
        lotId: 1,
        performedBy: userId,
      });
      expect(dbMock.returning).toHaveBeenCalled();
      expect(result.id).toBe(10);
      expect(result.status).toBe('PASS');
    });

    it('should throw NotFoundException if control lot does not exist', async () => {
      // Arrange
      dbMock.where.mockResolvedValueOnce([]); // no lot found

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(NotFoundException);
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if control lot is missing mean or standard deviation', async () => {
      // Arrange
      dbMock.where.mockResolvedValueOnce([{ id: 1, mean: null, standardDevi: 0.5 }]);

      // Act & Assert
      await expect(service.create(dto, userId)).rejects.toThrow(BadRequestException);
      expect(dbMock.insert).not.toHaveBeenCalled();
    });

    it('should assign WARNING status if zScore is between 2 and 3', async () => {
      // Arrange
      // 15.2 against mean 14.0, SD 0.5 => z-score = 2.4 (WARNING)
      const warningDto = { ...dto, measuredValue: 15.2 };
      dbMock.where.mockResolvedValueOnce([{ id: 1, mean: 14.0, standardDevi: 0.5 }]);
      dbMock.returning.mockResolvedValueOnce([{
        id: 11,
        ...warningDto,
        status: 'WARNING',
        performedBy: userId,
      }]);

      // Act
      const result = await service.create(warningDto, userId);

      // Assert
      expect(result.status).toBe('WARNING');
      expect(dbMock.values).toHaveBeenCalledWith(expect.objectContaining({ status: 'WARNING' }));
    });

    it('should assign FAIL status if zScore is greater than 3', async () => {
      // Arrange
      // 16.0 against mean 14.0, SD 0.5 => z-score = 4.0 (FAIL)
      const failDto = { ...dto, measuredValue: 16.0 };
      dbMock.where.mockResolvedValueOnce([{ id: 1, mean: 14.0, standardDevi: 0.5 }]);
      dbMock.returning.mockResolvedValueOnce([{
        id: 12,
        ...failDto,
        status: 'FAIL',
        performedBy: userId,
      }]);

      // Act
      const result = await service.create(failDto, userId);

      // Assert
      expect(result.status).toBe('FAIL');
      expect(dbMock.values).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAIL' }));
    });
  });

  describe('findAll', () => {
    it('should return lot data and associated results', async () => {
      // Arrange
      dbMock.query.controlLots.findFirst.mockResolvedValueOnce({
        id: 1,
        lotNumber: 'LOT-HGB-2026',
        mean: 14.0,
        standardDevi: 0.5,
        upperControlLimit: 15.5,
        lowerControlLimit: 12.5,
        upperWarningLimit: 15.0,
        lowerWarningLimit: 13.0,
        qcTest: {
          testName: 'Hemoglobin',
          machine: { name: 'Sysmex XN-1000' },
        },
      });

      const mockResults = [
        { id: 1, measuredValue: 14.2, status: 'PASS' },
        { id: 2, measuredValue: 14.6, status: 'WARNING' },
      ];
      dbMock.orderBy.mockResolvedValueOnce(mockResults);

      // Act
      const result = await service.findAll(1);

      // Assert
      expect(dbMock.query.controlLots.findFirst).toHaveBeenCalled();
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.from).toHaveBeenCalled();
      expect(dbMock.where).toHaveBeenCalled();
      expect(dbMock.orderBy).toHaveBeenCalled();
      expect(result.lot.testName).toBe('Hemoglobin');
      expect(result.lot.machineName).toBe('Sysmex XN-1000');
      expect(result.results).toEqual(mockResults);
      expect(result.results).toHaveLength(2);
    });

    it('should throw NotFoundException if control lot does not exist', async () => {
      // Arrange
      dbMock.query.controlLots.findFirst.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findAll(99)).rejects.toThrow(NotFoundException);
      expect(dbMock.select).not.toHaveBeenCalled(); // The results query shouldn't run
    });
  });

  describe('findOne', () => {
    it('should return a QC result with dynamically calculated zScore', async () => {
      // Arrange
      dbMock.query.qcResults.findFirst.mockResolvedValueOnce({
        id: 1,
        measuredValue: 15.0,
        controlLot: { mean: 14.0, standardDevi: 0.5 },
      });

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(dbMock.query.qcResults.findFirst).toHaveBeenCalled();
      expect(result.id).toBe(1);
      // (15.0 - 14.0) / 0.5 = 2.0
      expect(result.zScore).toBe(2);
    });

    it('should throw NotFoundException if QC result not found', async () => {
      // Arrange
      dbMock.query.qcResults.findFirst.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if associated lot is missing stats', async () => {
      // Arrange
      dbMock.query.qcResults.findFirst.mockResolvedValueOnce({
        id: 1,
        measuredValue: 15.0,
        controlLot: { mean: null, standardDevi: null },
      });

      // Act & Assert
      await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateQcResultDto = { comments: 'Instrument recalibrated' };

    it('should update the comments and return the full result by internally calling findOne', async () => {
      // Arrange
      // The update query returns the updated basic row
      dbMock.returning.mockResolvedValueOnce([{ id: 1, comments: 'Instrument recalibrated' }]);

      // We MUST mock findOne directly on the service instance because update calls this.findOne(id)
      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        id: 1,
        comments: 'Instrument recalibrated',
        measuredValue: 14.5,
        controlLot: { mean: 14.0, standardDevi: 0.5 },
        zScore: 1,
      } as any);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith({ comments: updateDto.comments });
      expect(dbMock.where).toHaveBeenCalled();
      expect(dbMock.returning).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith(1);
      expect(result.comments).toBe('Instrument recalibrated');
      expect(result.zScore).toBe(1);
    });

    it('should throw NotFoundException if QC result is not found', async () => {
      // Arrange
      dbMock.returning.mockResolvedValueOnce([]); // update returns empty when row not found

      // Act & Assert
      await expect(service.update(99, updateDto)).rejects.toThrow(NotFoundException);
      expect(dbMock.update).toHaveBeenCalled();
    });
  });
});
