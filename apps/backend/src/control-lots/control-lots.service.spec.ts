import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ControlLotsService } from './control-lots.service';
import { ControlLotsRepository } from './control-lots.repository';

// The single frozen point-in-time used across every test.
// All "days old" dates are expressed as explicit ISO strings relative to this.
const FROZEN_NOW = new Date('2026-05-22T12:00:00Z');

describe('ControlLotsService', () => {
  let service: ControlLotsService;
  let mockRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    // Lock the system clock so computeAgeFlags() always sees FROZEN_NOW
    jest.useFakeTimers();
    jest.setSystemTime(FROZEN_NOW);

    mockRepository = {
      findTestById: jest.fn(),
      createWithDeactivation: jest.fn(),
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

  afterEach(() => {
    // Restore the real clock so nothing leaks into other test suites
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const newLotDto = {
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

    it('should deactivate previous lots and return the newly created lot', async () => {
      // Arrange — lot was created 3 days before FROZEN_NOW → 2026-05-19
      mockRepository.findTestById.mockResolvedValue({ id: 1, testName: 'Hemoglobin' });
      mockRepository.createWithDeactivation.mockResolvedValue({
        id: 1,
        ...newLotDto,
        expirationDate: new Date('2026-12-31'),
        isActive: true,
        createdAt: new Date('2026-05-19T12:00:00Z'),
      });

      // Act
      const result = await service.create(newLotDto);

      // Assert
      expect(mockRepository.createWithDeactivation).toHaveBeenCalledWith(
        newLotDto.testId,
        expect.objectContaining({
          lotNumber: newLotDto.lotNumber,
          expirationDate: new Date(newLotDto.expirationDate),
        }),
      );
      expect(result.id).toBe(1);
      expect(result.lotNumber).toBe('LOT-HGB-2026-A');
      expect(result.isActive).toBe(true);
    });

    it('should return daysActive=5 and needsChecking=false for a 5-day-old lot', async () => {
      // Arrange — created 5 days before FROZEN_NOW → 2026-05-17
      mockRepository.findTestById.mockResolvedValue({ id: 1, testName: 'Hemoglobin' });
      mockRepository.createWithDeactivation.mockResolvedValue({
        id: 1,
        ...newLotDto,
        expirationDate: new Date('2026-12-31'),
        isActive: true,
        createdAt: new Date('2026-05-17T12:00:00Z'),
      });

      // Act
      const result = await service.create(newLotDto);

      // Assert
      expect(result.daysActive).toBe(5);
      expect(result.needsChecking).toBe(false);
    });

    it('should set needsChecking=true when lot is 12 days old', async () => {
      // Arrange — created 12 days before FROZEN_NOW → 2026-05-10
      mockRepository.findTestById.mockResolvedValue({ id: 1, testName: 'Hemoglobin' });
      mockRepository.createWithDeactivation.mockResolvedValue({
        id: 1,
        ...newLotDto,
        isActive: true,
        createdAt: new Date('2026-05-10T12:00:00Z'),
      });

      // Act
      const result = await service.create(newLotDto);

      // Assert
      expect(result.daysActive).toBe(12);
      expect(result.needsChecking).toBe(true);
    });

    it('should return daysActive=0 and needsChecking=false when createdAt is null', async () => {
      // Arrange
      mockRepository.findTestById.mockResolvedValue({ id: 1, testName: 'Hemoglobin' });
      mockRepository.createWithDeactivation.mockResolvedValue({
        id: 1,
        ...newLotDto,
        isActive: true,
        createdAt: null,
      });

      // Act
      const result = await service.create(newLotDto);

      // Assert
      expect(result.daysActive).toBe(0);
      expect(result.needsChecking).toBe(false);
    });

    it('should throw NotFoundException when QC test does not exist', async () => {
      // Arrange
      mockRepository.findTestById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.create(newLotDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(newLotDto)).rejects.toThrow(
        `QC Test with ID ${newLotDto.testId} not found`,
      );
    });

    it('should pass the expirationDate as a Date object to the repository', async () => {
      // Arrange
      mockRepository.findTestById.mockResolvedValue({ id: 1, testName: 'Hemoglobin' });
      mockRepository.createWithDeactivation.mockResolvedValue({
        id: 1,
        ...newLotDto,
        expirationDate: new Date('2026-12-31'),
        isActive: true,
        createdAt: new Date('2026-05-22T12:00:00Z'),
      });

      // Act
      await service.create(newLotDto);

      // Assert
      expect(mockRepository.createWithDeactivation).toHaveBeenCalledWith(
        newLotDto.testId,
        expect.objectContaining({
          expirationDate: new Date('2026-12-31'),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all lots enriched with daysActive and needsChecking', async () => {
      // Arrange
      // Lot 1: created 3 days ago → 2026-05-19 → needsChecking=false
      // Lot 2: created 15 days ago → 2026-05-07 → needsChecking=true
      const lots = [
        { id: 1, lotNumber: 'LOT-HGB-2026-A', createdAt: new Date('2026-05-19T12:00:00Z') },
        { id: 2, lotNumber: 'LOT-WBC-2026-A', createdAt: new Date('2026-05-07T12:00:00Z') },
      ];
      mockRepository.findAll.mockResolvedValue(lots);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].daysActive).toBe(3);
      expect(result[0].needsChecking).toBe(false);
      expect(result[1].daysActive).toBe(15);
      expect(result[1].needsChecking).toBe(true);
    });

    it('should return empty array when no lots exist', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle lots with null createdAt gracefully', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([
        { id: 1, lotNumber: 'LOT-HGB-2026-A', createdAt: null },
      ]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result[0].daysActive).toBe(0);
      expect(result[0].needsChecking).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the control lot enriched with daysActive=7 and needsChecking=false', async () => {
      // Arrange — created 7 days before FROZEN_NOW → 2026-05-15
      mockRepository.findById.mockResolvedValue({
        id: 1,
        lotNumber: 'LOT-HGB-2026-A',
        mean: 14.0,
        createdAt: new Date('2026-05-15T12:00:00Z'),
      });

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result.id).toBe(1);
      expect(result.daysActive).toBe(7);
      expect(result.needsChecking).toBe(false);
    });

    it('should set needsChecking=true when lot is exactly 10 days old', async () => {
      // Arrange — created exactly 10 days before FROZEN_NOW → 2026-05-12
      mockRepository.findById.mockResolvedValue({
        id: 1,
        lotNumber: 'LOT-HGB-2026-A',
        createdAt: new Date('2026-05-12T12:00:00Z'),
      });

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result.daysActive).toBe(10);
      expect(result.needsChecking).toBe(true);
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99)).rejects.toThrow(
        'Control lot with ID 99 not found',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findByTestId
  // ---------------------------------------------------------------------------
  describe('findByTestId', () => {
    it('should return all lots for a specific test enriched with expiration fields', async () => {
      // Arrange — both lots created 4 days ago → 2026-05-18 → needsChecking=false
      const lots = [
        { id: 1, testId: 1, lotNumber: 'LOT-HGB-2026-A', createdAt: new Date('2026-05-18T12:00:00Z') },
        { id: 3, testId: 1, lotNumber: 'LOT-HGB-2026-B', createdAt: new Date('2026-05-18T12:00:00Z') },
      ];
      mockRepository.findByTestId.mockResolvedValue(lots);

      // Act
      const result = await service.findByTestId(1);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((lot) => lot.testId === 1)).toBe(true);
      expect(result.every((lot) => lot.daysActive === 4)).toBe(true);
      expect(result.every((lot) => lot.needsChecking === false)).toBe(true);
    });

    it('should return empty array when test has no lots', async () => {
      // Arrange
      mockRepository.findByTestId.mockResolvedValue([]);

      // Act
      const result = await service.findByTestId(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should return the updated lot enriched with daysActive=2 and needsChecking=false', async () => {
      // Arrange — created 2 days before FROZEN_NOW → 2026-05-20
      const createdAt = new Date('2026-05-20T12:00:00Z');
      mockRepository.findById.mockResolvedValue({ id: 1, mean: 14.0, createdAt });
      mockRepository.update.mockResolvedValue({ id: 1, mean: 14.5, createdAt });

      // Act
      const result = await service.update(1, { mean: 14.5 });

      // Assert
      expect(result.mean).toBe(14.5);
      expect(result.daysActive).toBe(2);
      expect(result.needsChecking).toBe(false);
    });

    it('should convert expiration date string to Date object before saving', async () => {
      // Arrange
      const createdAt = new Date('2026-05-22T12:00:00Z');
      mockRepository.findById.mockResolvedValue({ id: 1, createdAt });
      mockRepository.update.mockResolvedValue({
        id: 1,
        expirationDate: new Date('2027-06-30'),
        createdAt,
      });

      // Act
      const result = await service.update(1, { expirationDate: '2027-06-30' });

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ expirationDate: new Date('2027-06-30') }),
      );
      expect(result.expirationDate).toEqual(new Date('2027-06-30'));
    });

    it('should pass through fields that are not expirationDate unchanged', async () => {
      // Arrange
      const createdAt = new Date('2026-05-22T12:00:00Z');
      mockRepository.findById.mockResolvedValue({ id: 1, createdAt });
      mockRepository.update.mockResolvedValue({ id: 1, mean: 15.0, createdAt });

      // Act
      await service.update(1, { mean: 15.0 });

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ mean: 15.0 }),
      );
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.update(99, { mean: 14.5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should deactivate the lot and return a success message with the lot', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue({ id: 1, isActive: true });
      mockRepository.deactivate.mockResolvedValue({ id: 1, isActive: false });

      // Act
      const result = await service.remove(1);

      // Assert
      expect(result.message).toBe('Control lot deactivated successfully');
      expect(result.lot.isActive).toBe(false);
    });

    it('should call deactivate with the correct lot id', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue({ id: 7, isActive: true });
      mockRepository.deactivate.mockResolvedValue({ id: 7, isActive: false });

      // Act
      await service.remove(7);

      // Assert
      expect(mockRepository.deactivate).toHaveBeenCalledWith(7);
    });

    it('should throw NotFoundException when control lot does not exist', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
