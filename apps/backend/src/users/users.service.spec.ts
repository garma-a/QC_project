import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from 'src/database/database.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user-dto';
import * as argon2 from 'argon2';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from './dto/admin-create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: Partial<Record<keyof DatabaseService, any>>;

  beforeEach(async () => {
    // Mock methods of DatabaseService
    databaseService = {
      db: {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('createUser', () => {
  it('should create a new user', async () => {
    const dto: AdminCreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
       role: UserRole.ENGINEER,
      isActive: true,
    };

    // Mock select to return empty (no existing user)
    databaseService.db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue([{ length: 0 }]) });
    
    // Mock insert returning created user
    databaseService.db.insert.mockReturnValueOnce({
      values: jest.fn().mockReturnValueOnce({
        returning: jest.fn().mockResolvedValueOnce([
          {
            id: 1,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            passwordHash: await argon2.hash(dto.password),
            role: dto.role,
            isActive: dto.isActive,
          },
        ]),
      }),
    });

    const result = await service.createUser(dto);

    expect(result).toHaveProperty('id');
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.email).toBe(dto.email);
  });

  it('should throw ConflictException if email exists', async () => {
    databaseService.db.select.mockReturnValueOnce({ from: jest.fn().mockReturnValue([{ id: 1, email: 'exists@example.com' }]) });

    const dto: AdminCreateUserDto = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'exists@example.com',
      password: 'password123',
    };

    await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
  });
});
  describe('deactivateUser', () => {
  it('should deactivate a user', async () => {
    databaseService.db.update.mockReturnValueOnce({
      set: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([{ id: 1, isActive: false }]),
        }),
      }),
    });

    const result = await service.deactivateUser(1);
    expect(result).toEqual({ message: 'User deactivated successfully' });
  });

  it('should throw NotFoundException if user does not exist', async () => {
    databaseService.db.update.mockReturnValueOnce({
      set: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    await expect(service.deactivateUser(999)).rejects.toThrow(NotFoundException);
  });
});

describe('updateUser', () => {
  it('should update an existing user', async () => {
    const dto: AdminUpdateUserDto = {
      firstName: 'Updated',
      role: UserRole.ADMIN,
    };

    // Mock select to find existing user
    databaseService.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce([{ id: 1, firstName: 'John', role: UserRole.INTERN }]),
    });

    // Mock update to return updated user
    databaseService.db.update.mockReturnValueOnce({
      set: jest.fn().mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([{ id: 1, firstName: 'Updated', role: UserRole.ADMIN }]),
        }),
      }),
    });

    const result = await service.updateUser(1, dto);
    expect(result.firstName).toBe('Updated');
    expect(result.role).toBe(UserRole.ADMIN);
  });

  it('should throw NotFoundException if user does not exist', async () => {
    databaseService.db.select.mockReturnValueOnce({
      from: jest.fn().mockReturnValueOnce([]),
    });

    const dto: AdminUpdateUserDto = { firstName: 'Nobody' };
    await expect(service.updateUser(999, dto)).rejects.toThrow(NotFoundException);
  });
});
});