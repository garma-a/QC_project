import { Test, TestingModule } from '@nestjs/testing';
import { QcResultsController } from './qc-results.controller';
import { QcResultsService } from './qc-results.service';
import { CreateQcResultDto } from './dto/create-qc-result.dto';
import { UpdateQcResultDto } from './dto/update-qc-result.dto';
import { NotFoundException } from '@nestjs/common';

describe('QcResultsController', () => {
  let controller: QcResultsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QcResultsController],
      providers: [
        {
          provide: QcResultsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<QcResultsController>(QcResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and userId, and return the new result', async () => {
      // Arrange
      const dto: CreateQcResultDto = {
        measuredValue: 14.2,
        lotId: 1,
        comments: 'Test comment',
      };
      const userId = 5;
      const mockResult = { id: 10, ...dto, status: 'PASS', performedBy: userId };
      serviceMock.create.mockResolvedValue(mockResult);

      // Act
      const result = await controller.create(dto, userId);

      // Assert
      expect(serviceMock.create).toHaveBeenCalledTimes(1);
      expect(serviceMock.create).toHaveBeenCalledWith(dto, userId);
      expect(result).toEqual(mockResult);
      expect(result.id).toBe(10);
    });
  });

  describe('findAll', () => {
    it('should return lot data and associated results', async () => {
      // Arrange
      const mockResponse = {
        lot: { id: 1, mean: 14.0 },
        results: [{ id: 1, measuredValue: 14.2 }],
      };
      serviceMock.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll(1);

      // Assert
      expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      expect(serviceMock.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResponse);
    });

    it('should propagate NotFoundException if lot does not exist', async () => {
      // Arrange
      serviceMock.findAll.mockRejectedValue(
        new NotFoundException('Control lot not found'),
      );

      // Act & Assert
      await expect(controller.findAll(99)).rejects.toThrow(NotFoundException);
      expect(serviceMock.findAll).toHaveBeenCalledWith(99);
    });
  });

  describe('findOne', () => {
    it('should return a single QC result with calculated zScore', async () => {
      // Arrange
      const mockResult = { id: 1, measuredValue: 14.5, zScore: 1.0 };
      serviceMock.findOne.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
      expect(serviceMock.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
      expect(result.zScore).toBe(1.0);
    });

    it('should propagate NotFoundException from service', async () => {
      // Arrange
      serviceMock.findOne.mockRejectedValue(
        new NotFoundException('QC Result not found'),
      );

      // Act & Assert
      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
      expect(serviceMock.findOne).toHaveBeenCalledWith(99);
    });
  });

  describe('update', () => {
    it('should call service.update and return the updated result', async () => {
      // Arrange
      const dto: UpdateQcResultDto = { comments: 'Updated comment' };
      const mockResult = { id: 1, comments: 'Updated comment', zScore: 0.5 };
      serviceMock.update.mockResolvedValue(mockResult);

      // Act
      const result = await controller.update(1, dto);

      // Assert
      expect(serviceMock.update).toHaveBeenCalledTimes(1);
      expect(serviceMock.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
      expect(result.comments).toBe('Updated comment');
    });

    it('should propagate NotFoundException when updating non-existent result', async () => {
      // Arrange
      const dto: UpdateQcResultDto = { comments: 'Updated comment' };
      serviceMock.update.mockRejectedValue(
        new NotFoundException('QC Result with ID 99 not found'),
      );

      // Act & Assert
      await expect(controller.update(99, dto)).rejects.toThrow(NotFoundException);
      expect(serviceMock.update).toHaveBeenCalledWith(99, dto);
    });
  });
});
