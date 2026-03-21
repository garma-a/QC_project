import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { Role } from '@/auth/auth.types';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    findSectionById: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findEmailCollision: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    findAllWithSections: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
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
      sectionId: 1,
    };

    it('throws BadRequestException when section does not exist', async () => {
      mockUsersRepository.findSectionById.mockResolvedValueOnce(undefined);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        `Laboratory section with ID ${createUserDto.sectionId} does not exist.`,
      );
    });

    it('throws ConflictException when email already exists', async () => {
      mockUsersRepository.findSectionById.mockResolvedValue({ id: 1 });
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
      mockUsersRepository.findSectionById.mockResolvedValueOnce({ id: 1 });
      mockUsersRepository.findByEmail.mockResolvedValueOnce(undefined);
      mockUsersRepository.create.mockResolvedValueOnce({
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionId: 1,
      });

      const result = await service.createUser(createUserDto);

      expect(result).toEqual({
        id: 10,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionId: 1,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('creates user without section when sectionId is not provided', async () => {
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
        sectionId: null,
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
      sectionId: 2,
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
      mockUsersRepository.findSectionById.mockResolvedValue(undefined);

      await expect(service.updateUser(5, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateUser(5, updateDto)).rejects.toThrow(
        `Cannot move user. Laboratory section with ID ${updateDto.sectionId} does not exist.`,
      );
    });

    it('returns updated user without password hash when update is successful', async () => {
      mockUsersRepository.findById.mockResolvedValueOnce({ id: 5 });
      mockUsersRepository.findEmailCollision.mockResolvedValueOnce(undefined);
      mockUsersRepository.findSectionById.mockResolvedValueOnce({ id: 2 });
      mockUsersRepository.update.mockResolvedValueOnce({
        id: 5,
        firstName: 'Updated',
        lastName: 'Doe',
        email: 'updated@example.com',
        passwordHash: 'hashed_password',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionId: 2,
      });

      const result = await service.updateUser(5, updateDto);

      expect(result).toEqual({
        id: 5,
        firstName: 'Updated',
        lastName: 'Doe',
        email: 'updated@example.com',
        role: Role.TECHNICIAN,
        isActive: true,
        sectionId: 2,
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
      mockUsersRepository.findById.mockResolvedValue(undefined);

      await expect(service.getUserById(99)).rejects.toThrow(NotFoundException);
      await expect(service.getUserById(99)).rejects.toThrow(
        'User with ID 99 not found',
      );
    });

    it('returns user without password hash when user exists', async () => {
      mockUsersRepository.findById.mockResolvedValueOnce({
        id: 5,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        role: Role.TECHNICIAN,
        isActive: true,
      });

      const result = await service.getUserById(5);

      expect(result).toEqual({
        id: 5,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: Role.TECHNICIAN,
        isActive: true,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
