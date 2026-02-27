import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from 'src/database/database.service';
import { AdminCreateUserDto, UserRole } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';
import * as argon2 from 'argon2';
import { ConflictException, NotFoundException } from '@nestjs/common';

// 1. Mock argon2 globally
jest.mock('argon2');

describe('UsersService', () => {
  let service: UsersService;
  let dbMock: any;

  beforeEach(async () => {
    // 2. Create the Fluent Mock Object
    // .mockReturnThis() ensures that db.select().from().where() doesn't crash
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
        UsersService,
        {
          provide: DatabaseService,
          // We wrap the mock in an object to match your service's 'this.databaseService.db'
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
      email: 'john@example.com',
      password: 'password123',
      role: UserRole.ENGINEER,
      isActive: true,
    };

    it('should create a new user', async () => {
      // Mock "Select" finding nothing (Email is free)
      dbMock.where.mockResolvedValueOnce([]); 

      // Mock "Argon2" hash
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Mock "Insert" result
      dbMock.returning.mockResolvedValueOnce([
        { id: 1, ...dto, passwordHash: 'hashed_password' },
      ]);

      const result = await service.createUser(dto);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(dto.email);
      expect(result).not.toHaveProperty('passwordHash'); // Service should delete this
    });

    it('should throw ConflictException if email exists', async () => {
      // Mock "Select" finding an existing user
      dbMock.where.mockResolvedValueOnce([{ id: 1, email: 'john@example.com' }]);

      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      dbMock.returning.mockResolvedValueOnce([{ id: 1, isActive: false }]);

      const result = await service.deactivateUser(1);
      expect(result).toEqual({ message: 'User deactivated successfully' });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      dbMock.returning.mockResolvedValueOnce([]);

      await expect(service.deactivateUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    const updateDto: AdminUpdateUserDto = { firstName: 'UpdatedName' };

    it('should update an existing user', async () => {
      // Mock finding the user first
      dbMock.where.mockResolvedValueOnce([{ id: 1, firstName: 'OldName' }]);
      // Mock the update result
      dbMock.returning.mockResolvedValueOnce([{ id: 1, firstName: 'UpdatedName' }]);

      const result = await service.updateUser(1, updateDto);
      expect(result.firstName).toBe('UpdatedName');
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      // Mock finding nothing during the initial check
      dbMock.where.mockResolvedValueOnce([]);

      await expect(service.updateUser(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });
});