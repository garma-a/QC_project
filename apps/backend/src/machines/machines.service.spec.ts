import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MachinesService } from './machines.service';
import { MachinesRepository } from './machines.repository';

describe('MachinesService', () => {
  let service: MachinesService;
  let mockRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: MachinesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MachinesService>(MachinesService);
  });

  describe('create', () => {
    const newMachineData = {
      name: 'Cobas 6000',
      hospitalCode: 'LAB-EQ-001',
      sectionId: 1,
    };

    it('should return the created machine', async () => {
      const createdMachine = { id: 1, ...newMachineData };
      mockRepository.create.mockResolvedValue(createdMachine);

      const result = await service.create(newMachineData);

      expect(result).toEqual(createdMachine);
    });

    it('should throw BadRequestException when section does not exist', async () => {
      mockRepository.create.mockRejectedValue({ code: '23503' });

      await expect(service.create(newMachineData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when machine already exists', async () => {
      mockRepository.create.mockRejectedValue({ code: '23505' });

      await expect(service.create(newMachineData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException for unexpected database errors', async () => {
      mockRepository.create.mockRejectedValue({ code: 'UNKNOWN' });

      await expect(service.create(newMachineData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all machines', async () => {
      const machines = [
        { id: 1, name: 'Cobas 6000', hospitalCode: 'LAB-EQ-001', sectionId: 1 },
        { id: 2, name: 'Sysmex XN', hospitalCode: 'LAB-EQ-002', sectionId: 2 },
      ];
      mockRepository.findAll.mockResolvedValue(machines);

      const result = await service.findAll();

      expect(result).toEqual(machines);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no machines exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return the machine when found', async () => {
      const machine = {
        id: 1,
        name: 'Cobas 6000',
        hospitalCode: 'LAB-EQ-001',
        sectionId: 1,
      };
      mockRepository.findById.mockResolvedValue(machine);

      const result = await service.findOne(1);

      expect(result).toEqual(machine);
    });

    it('should throw NotFoundException when machine does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateData = { name: 'Cobas 8000' };

    it('should return the updated machine', async () => {
      const updatedMachine = {
        id: 1,
        name: 'Cobas 8000',
        hospitalCode: 'LAB-EQ-001',
        sectionId: 1,
      };
      mockRepository.update.mockResolvedValue(updatedMachine);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedMachine);
    });

    it('should throw NotFoundException when machine does not exist', async () => {
      mockRepository.update.mockResolvedValue(undefined);

      await expect(service.update(999, updateData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when updating to invalid section', async () => {
      mockRepository.update.mockRejectedValue({ code: '23503' });

      await expect(service.update(1, { sectionId: 999 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should return the deleted machine', async () => {
      const machine = {
        id: 1,
        name: 'Cobas 6000',
        hospitalCode: 'LAB-EQ-001',
        sectionId: 1,
      };
      mockRepository.delete.mockResolvedValue(machine);

      const result = await service.remove(1);

      expect(result).toEqual(machine);
    });

    it('should throw NotFoundException when machine does not exist', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
