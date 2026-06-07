import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { Role } from '@/auth/auth.types';
import { WorkerService } from '@/auth/workers/worker.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findSectionsByIds: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIdWithSections: jest.fn(),
    findEmailCollision: jest.fn(),
    create: jest.fn(),
    assignSections: jest.fn(),
    replaceUserSections: jest.fn(),
    getSectionIdsForUser: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    findAllWithSections: jest.fn(),
  };

  const mockWorkerService = {
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: WorkerService, useValue: mockWorkerService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser()', () => {
    const createUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: Role.TECHNICIAN,
      sectionIds: [1],
    };

    it('throws BadRequestException when section does not exist', async () => {
      mockUsersRepository.findSectionsByIds.mockResolvedValue([]);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        'Laboratory section IDs do not exist: 1',
      );
    });

    it('throws ConflictException when email already exists', async () => {
      mockUsersRepository.findSectionsByIds.mockResolvedValue([{ id: 1 }]);
      mockUsersRepository.findByEmail.mockResolvedValue({
        id: 5,
        email: createUserDto.email,
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('returns user without password hash when creation is successful', async () => {
      mockUsersRepository.findSectionsByIds.mockResolvedValueOnce([{ id: 1, name: 'Hematology' }]);
      mockUsersRepository.findByEmail.mockResolvedValueOnce(undefined);
      mockUsersRepository.create.mockResolvedValueOnce({
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        role: Role.TECHNICIAN,
        isActive: true,
      });

      const result = await service.createUser(createUserDto);

      expect(result).toEqual({
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionIds: [1],
        sectionNames: ['Hematology'],
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('creates user without section when sectionIds is not provided', async () => {
      const dtoWithoutSection = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
      };

      mockUsersRepository.findByEmail.mockResolvedValueOnce(undefined);
      mockUsersRepository.create.mockResolvedValueOnce({
        id: 11,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: true,
      });

      const result = await service.createUser(dtoWithoutSection);

      expect(result.email).toBe('jane@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('deactivateUser()', () => {
    it('throws BadRequestException when admin tries to deactivate themselves', async () => {
      await expect(service.deactivateUser(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deactivateUser(1, 1)).rejects.toThrow(
        'You cannot deactivate your own administrator account.',
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUsersRepository.deactivate.mockResolvedValueOnce(undefined);

      await expect(service.deactivateUser(99, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deactivateUser(99, 1)).rejects.toThrow(
        'User not found',
      );
    });

    it('returns success message when user is deactivated', async () => {
      mockUsersRepository.deactivate.mockResolvedValueOnce({
        id: 5,
        isActive: false,
      });

      const result = await service.deactivateUser(5, 1);

      expect(result).toEqual({ message: 'User deactivated successfully' });
    });
  });

  describe('updateUser()', () => {
    const updateDto = {
      firstName: 'Updated',
      email: 'updated@example.com',
      sectionIds: [2],
    };

    it('throws NotFoundException when user does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValueOnce(undefined);

      await expect(service.updateUser(99, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateUser(99, updateDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('throws ConflictException when email is already in use by another user', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: 5 });
      mockUsersRepository.findEmailCollision.mockResolvedValue({
        id: 10,
        email: updateDto.email,
      });

      await expect(service.updateUser(5, updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.updateUser(5, updateDto)).rejects.toThrow(
        `Email ${updateDto.email} is already in use by another staff member.`,
      );
    });

    it('throws BadRequestException when section does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue({ id: 5 });
      mockUsersRepository.findEmailCollision.mockResolvedValue(undefined);
      mockUsersRepository.findSectionsByIds.mockResolvedValue([]);

      await expect(service.updateUser(5, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUser(5, updateDto)).rejects.toThrow(
        'Cannot update user. Laboratory section IDs do not exist: 2',
      );
    });

    it('returns updated user without password hash when update is successful', async () => {
      mockUsersRepository.findById.mockResolvedValueOnce({ id: 5 });
      mockUsersRepository.findEmailCollision.mockResolvedValueOnce(undefined);
      mockUsersRepository.findSectionsByIds.mockResolvedValueOnce([{ id: 2, name: 'Chemistry' }]);
      mockUsersRepository.update.mockResolvedValueOnce({
        id: 5,
        firstName: 'Updated',
        lastName: 'Doe',
        email: 'updated@example.com',
        passwordHash: 'hashed_password',
        role: Role.TECHNICIAN,
        isActive: true,
      });

      const result = await service.updateUser(5, updateDto);

      expect(result).toEqual({
        id: 5,
        firstName: 'Updated',
        lastName: 'Doe',
        email: 'updated@example.com',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionIds: [2],
        sectionNames: ['Chemistry'],
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('getUsers()', () => {
    it('throws BadRequestException when invalid role filter is provided', async () => {
      await expect(service.getUsers('INVALID_ROLE' as Role)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getUsers('INVALID_ROLE' as Role)).rejects.toThrow(
        '"INVALID_ROLE" is not a valid user role.',
      );
    });

    it('returns all users when no role filter is provided', async () => {
      const mockUsers = [
        { id: 1, firstName: 'John', role: Role.TECHNICIAN },
        { id: 2, firstName: 'Jane', role: Role.ADMIN },
      ];
      mockUsersRepository.findAllWithSections.mockResolvedValueOnce(mockUsers);

      const result = await service.getUsers();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('returns filtered users when role filter is provided', async () => {
      const mockUsers = [{ id: 1, firstName: 'John', role: Role.TECHNICIAN }];
      mockUsersRepository.findAllWithSections.mockResolvedValueOnce(mockUsers);

      const result = await service.getUsers(Role.TECHNICIAN);

      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById()', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockUsersRepository.findByIdWithSections.mockResolvedValue(undefined);

      await expect(service.getUserById(99)).rejects.toThrow(NotFoundException);
      await expect(service.getUserById(99)).rejects.toThrow(
        'User with ID 99 not found',
      );
    });

    it('returns user without password hash when user exists', async () => {
      mockUsersRepository.findByIdWithSections.mockResolvedValueOnce({
        id: 5,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionIds: [1, 3],
        sectionNames: ['Hematology', 'Chemistry'],
      });

      const result = await service.getUserById(5);

      expect(result).toEqual({
        id: 5,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionIds: [1, 3],
        sectionNames: ['Hematology', 'Chemistry'],
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
