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
      const dto: CreateControlLotDto = {
        testId: 1,
        lotNumber: 'LOT-HGB-2026-A',
        expirationDate: '2026-12-31',
      };
      const mockResult = { id: 1, ...dto };
      serviceMock.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);
      expect(result).toEqual(mockResult);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all control lots', async () => {
      const mockLots = [{ id: 1 }, { id: 2 }];
      serviceMock.findAll.mockResolvedValue(mockLots);

      const result = await controller.findAll();
      expect(result).toEqual(mockLots);
    });
  });

  describe('findOne', () => {
    it('should return a single control lot', async () => {
      const mockLot = { id: 1, lotNumber: 'LOT-HGB-2026-A' };
      serviceMock.findOne.mockResolvedValue(mockLot);

      const result = await controller.findOne(1);
      expect(result).toEqual(mockLot);
      expect(serviceMock.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      serviceMock.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should call service.update and return the updated lot', async () => {
      const dto: UpdateControlLotDto = { mean: 14.5 };
      const mockResult = { id: 1, mean: 14.5 };
      serviceMock.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, dto);
      expect(result).toEqual(mockResult);
      expect(serviceMock.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove and return success message', async () => {
      const mockResult = { message: 'Control lot deactivated successfully', lot: { id: 1 } };
      serviceMock.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(1);
      expect(result.message).toContain('deactivated');
      expect(serviceMock.remove).toHaveBeenCalledWith(1);
    });
  });
});
