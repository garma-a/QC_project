import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/auth/auth.service';
import { DatabaseService } from '@/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockWhere = jest.fn();
  const mockDb = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: mockWhere,
      }),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: { db: mockDb },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = { email: 'test@lab.com', password: 'password123' };

    it('Branch 1: should throw UnauthorizedException if user is not found', async () => {
      mockWhere.mockResolvedValueOnce([]);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('Branch 2: should throw UnauthorizedException if password does not match', async () => {
      mockWhere.mockResolvedValueOnce([{ passwordHash: 'hashed_password' }]);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('Branch 3: should throw UnauthorizedException if account is deactivated', async () => {
      mockWhere.mockResolvedValueOnce([
        { passwordHash: 'hashed_password', isActive: false },
      ]);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is deactivated'),
      );
    });

    it('Branch 4: should return an access token on successful login', async () => {
      const mockUser = {
        id: 1,
        role: 'TECHNICIAN',
        passwordHash: 'hashed_password',
        isActive: true,
      };

      mockWhere.mockResolvedValueOnce([mockUser]);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);
      (jwtService.sign as jest.Mock).mockReturnValueOnce('mock_jwt_token');

      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: 'mock_jwt_token' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role,
      });
    });
  });
});
