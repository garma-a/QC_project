import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '@/users/users.service';
import { DatabaseService } from '@/database/database.service';
import { AdminCreateUserDto } from '@/users/dto/admin-create-user.dto';
import { AdminUpdateUserDto } from '@/users/dto/admin-update-user-dto';
import * as argon2 from 'argon2';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '@/auth/auth.types';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn(),

      then: jest.fn(function(resolve) {

        return Promise.resolve(this.where()).then(resolve);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: { db: dbMock },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const dto: AdminCreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@hospital.com',
      password: 'password123',
      role: Role.TECHNICIAN,
      sectionId: 1,
    };

    it('should create a user if section exists and email is free', async () => {
      // Mock section check (exists)
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]);
      // Mock email check (free)
      dbMock.where.mockResolvedValueOnce([]);
      // Mock hash
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_pw');
      // Mock insert
      dbMock.returning.mockResolvedValueOnce([{ id: 1, ...dto, passwordHash: 'hashed_pw' }]);

      const result = await service.createUser(dto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(1);
    });

    it('should throw BadRequestException if section does not exist', async () => {
      dbMock.where.mockResolvedValueOnce([]); // Section not found
      await expect(service.createUser(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email is taken', async () => {
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]); // Section exists
      dbMock.where.mockResolvedValueOnce([{ id: 2 }]); // Email taken
      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUsers', () => {
    it('should return all users with their section names', async () => {
      const mockUsers = [{ id: 1, firstName: 'John', sectionName: 'Hematology' }];
      // When awaiting the query builder directly (await query)
      dbMock.where.mockResolvedValueOnce(mockUsers);

      const result = await service.getUsers();
      expect(result).toEqual(mockUsers);
    });

    it('should throw BadRequestException for invalid role filter', async () => {
      await expect(service.getUsers('SUPERMAN' as any)).rejects.toThrow(BadRequestException);
    });

    it('should return users filtered by a valid role', async () => {
      const mockAdmins = [{ id: 1, role: Role.ADMIN, firstName: 'Admin' }];
      // Mock the final where clause execution
      dbMock.where.mockResolvedValueOnce(mockAdmins);

      const result = await service.getUsers(Role.ADMIN);
      expect(result).toEqual(mockAdmins);
    });
  });

  describe('getUserById', () => {
    it('should return a user without passwordHash', async () => {
      dbMock.where.mockResolvedValueOnce([{ id: 1, firstName: 'John', passwordHash: 'secret' }]);

      const result = await service.getUserById(1);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if user missing', async () => {
      dbMock.where.mockResolvedValueOnce([]);
      await expect(service.getUserById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    const updateDto: AdminUpdateUserDto = { email: 'new@hospital.com' };

    it('should update user if email is not a collision', async () => {
      // 1. Initial user check
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]);
      // 2. Email collision check (found nothing)
      dbMock.where.mockResolvedValueOnce([]);
      // 3. Update return
      dbMock.returning.mockResolvedValueOnce([{ id: 1, email: 'new@hospital.com' }]);

      const result = await service.updateUser(1, updateDto);
      expect(result.email).toBe('new@hospital.com');
    });

    it('should throw ConflictException if updating to an existing email', async () => {
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]); // User exists
      dbMock.where.mockResolvedValueOnce([{ id: 2 }]); // Email collision with User 2

      await expect(service.updateUser(1, updateDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      // Mock the initial user lookup returning nothing
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.updateUser(1, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updating to a non-existent section', async () => {
      const updateSectionDto: AdminUpdateUserDto = { sectionId: 99 };

      // 1. Mock user exists
      dbMock.where.mockResolvedValueOnce([{ id: 1 }]);
      // 2. Mock section does not exist
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.updateUser(1, updateSectionDto)).rejects.toThrow(BadRequestException);
    });
  });

  // users.service.spec.ts

  describe('deactivateUser', () => {
    it('should return success message', async () => {
      dbMock.returning.mockResolvedValueOnce([{ id: 1, isActive: false }]);

      // Pass a different ID for the second argument so it doesn't trigger the check
      const result = await service.deactivateUser(1, 999);
      expect(result.message).toContain('success');
    });

    it('should throw BadRequestException if self-deactivating', async () => {
      // Test the new logic: IDs match
      await expect(service.deactivateUser(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user to deactivate is not found', async () => {
      // Mock the database update returning an empty array
      dbMock.returning.mockResolvedValueOnce([]);

      await expect(service.deactivateUser(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
