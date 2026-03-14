import { Test, TestingModule } from '@nestjs/testing';
import { ControlLotsController } from './control-lots.controller';
import { ControlLotsService } from './control-lots.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { NotFoundException } from '@nestjs/common';

describe('ControlLotsController', () => {
  let controller: ControlLotsController;
  let serviceMock: any;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControlLotsController],
      providers: [
        {
          provide: ControlLotsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ControlLotsController>(ControlLotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return the new lot', async () => {
      // Arrange
      const dto: CreateControlLotDto = {
        testId: 1,
        lotNumber: 'LOT-HGB-2026-A',
        expirationDate: '2026-12-31',
      };
      const mockResult = { id: 1, ...dto, isActive: true };
      serviceMock.create.mockResolvedValue(mockResult);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(serviceMock.create).toHaveBeenCalledTimes(1);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
      expect(result.id).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return all control lots', async () => {
      // Arrange
      const mockLots = [
        { id: 1, lotNumber: 'LOT-HGB-2026-A' },
        { id: 2, lotNumber: 'LOT-WBC-2026-A' },
      ];
      serviceMock.findAll.mockResolvedValue(mockLots);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLots);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a single control lot', async () => {
      // Arrange
      const mockLot = { id: 1, lotNumber: 'LOT-HGB-2026-A', mean: 14.0 };
      serviceMock.findOne.mockResolvedValue(mockLot);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(serviceMock.findOne).toHaveBeenCalledTimes(1);
      expect(serviceMock.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLot);
      expect(result.id).toBe(1);
    });

    it('should propagate NotFoundException from service', async () => {
      // Arrange
      serviceMock.findOne.mockRejectedValue(
        new NotFoundException('Control lot with ID 99 not found'),
      );

      // Act & Assert
      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
      expect(serviceMock.findOne).toHaveBeenCalledWith(99);
    });
  });

  describe('update', () => {
    it('should call service.update and return the updated lot', async () => {
      // Arrange
      const dto: UpdateControlLotDto = { mean: 14.5 };
      const mockResult = { id: 1, mean: 14.5 };
      serviceMock.update.mockResolvedValue(mockResult);

      // Act
      const result = await controller.update(1, dto);

      // Assert
      expect(serviceMock.update).toHaveBeenCalledTimes(1);
      expect(serviceMock.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
      expect(result.mean).toBe(14.5);
    });

    it('should propagate NotFoundException when updating non-existent lot', async () => {
      // Arrange
      const dto: UpdateControlLotDto = { mean: 14.5 };
      serviceMock.update.mockRejectedValue(
        new NotFoundException('Control lot with ID 99 not found'),
      );

      // Act & Assert
      await expect(controller.update(99, dto)).rejects.toThrow(NotFoundException);
      expect(serviceMock.update).toHaveBeenCalledWith(99, dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove and return success message', async () => {
      // Arrange
      const mockResult = {
        message: 'Control lot deactivated successfully',
        lot: { id: 1, isActive: false },
      };
      serviceMock.remove.mockResolvedValue(mockResult);

      // Act
      const result = await controller.remove(1);

      // Assert
      expect(serviceMock.remove).toHaveBeenCalledTimes(1);
      expect(serviceMock.remove).toHaveBeenCalledWith(1);
      expect(result.message).toContain('deactivated');
      expect(result.lot.isActive).toBe(false);
    });

    it('should propagate NotFoundException when removing non-existent lot', async () => {
      // Arrange
      serviceMock.remove.mockRejectedValue(
        new NotFoundException('Control lot with ID 99 not found'),
      );

      // Act & Assert
      await expect(controller.remove(99)).rejects.toThrow(NotFoundException);
      expect(serviceMock.remove).toHaveBeenCalledWith(99);
    });
  });
});
