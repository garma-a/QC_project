import { Test, TestingModule } from '@nestjs/testing';
import { ControlLotsService } from './control-lots.service';
import { DatabaseService } from '@/database/database.service';
import { CreateControlLotDto } from './dto/create-control-lot.dto';
import { UpdateControlLotDto } from './dto/update-control-lot.dto';
import { NotFoundException } from '@nestjs/common';

describe('ControlLotsService', () => {
  let service: ControlLotsService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlLotsService,
        {
          provide: DatabaseService,
          useValue: { db: dbMock },
        },
      ],
    }).compile();

    service = module.get<ControlLotsService>(ControlLotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateControlLotDto = {
      testId: 1,
      lotNumber: 'LOT-HGB-2026-A',
      expirationDate: '2026-12-31',
      mean: 14.0,
      standardDevi: 0.5,
      upperControlLimit: 15.5,
      lowerControlLimit: 12.5,
      upperWarningLimit: 15.0,
      lowerWarningLimit: 13.0,
    };

    it('should create a control lot if QC test exists', async () => {
      // Mock QC test check (exists)
      dbMock.where.mockResolvedValueOnce([{ id: 1, testName: 'Hemoglobin' }]);
      // Mock insert returning
      dbMock.returning.mockResolvedValueOnce([{
        id: 1,
        ...dto,
        expirationDate: new Date('2026-12-31'),
        isActive: true,
      }]);

      const result = await service.create(dto);
      expect(result.id).toBe(1);
      expect(result.lotNumber).toBe('LOT-HGB-2026-A');
    });

    it('should throw NotFoundException if QC test does not exist', async () => {
      // Mock QC test check (not found)
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all control lots', async () => {
      const mockLots = [
        { id: 1, lotNumber: 'LOT-HGB-2026-A' },
        { id: 2, lotNumber: 'LOT-WBC-2026-A' },
      ];
      dbMock.from.mockResolvedValueOnce(mockLots);

      const result = await service.findAll();
      expect(result).toEqual(mockLots);
    });
  });

  describe('findOne', () => {
    it('should return a control lot by ID', async () => {
      const mockLot = { id: 1, lotNumber: 'LOT-HGB-2026-A', mean: 14.0 };
      dbMock.where.mockResolvedValueOnce([mockLot]);

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
      expect(result.lotNumber).toBe('LOT-HGB-2026-A');
    });

    it('should throw NotFoundException if control lot not found', async () => {
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTestId', () => {
    it('should return all lots for a given test ID', async () => {
      const mockLots = [
        { id: 1, testId: 1, lotNumber: 'LOT-HGB-2026-A' },
        { id: 3, testId: 1, lotNumber: 'LOT-HGB-2026-B' },
      ];
      dbMock.where.mockResolvedValueOnce(mockLots);

      const result = await service.findByTestId(1);
      expect(result).toHaveLength(2);
      expect(result[0].testId).toBe(1);
    });
  });

  describe('update', () => {
    const updateDto: UpdateControlLotDto = { mean: 14.5 };

    it('should update a control lot if it exists', async () => {
      // Mock existence check
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]);
      // Mock update returning
      dbMock.returning.mockResolvedValueOnce([{ id: 1, mean: 14.5 }]);

      const result = await service.update(1, updateDto);
      expect(result.mean).toBe(14.5);
    });

    it('should handle expirationDate conversion on update', async () => {
      const dtoWithDate: UpdateControlLotDto = { expirationDate: '2027-06-30' };
      // Mock existence check
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]);
      // Mock update returning
      dbMock.returning.mockResolvedValueOnce([{ id: 1, expirationDate: new Date('2027-06-30') }]);

      const result = await service.update(1, dtoWithDate);
      expect(result.expirationDate).toEqual(new Date('2027-06-30'));
    });

    it('should throw NotFoundException if control lot to update does not exist', async () => {
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.update(99, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a control lot by setting isActive to false', async () => {
      // Mock existence check
      dbMock.where.mockResolvedValueOnce([{ id: 1, isActive: true }]);
      // Mock update returning
      dbMock.returning.mockResolvedValueOnce([{ id: 1, isActive: false }]);

      const result = await service.remove(1);
      expect(result.message).toContain('deactivated');
      expect(result.lot.isActive).toBe(false);
    });

    it('should throw NotFoundException if control lot to remove does not exist', async () => {
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
