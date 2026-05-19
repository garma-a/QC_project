import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthRepository: Record<string, jest.Mock>;
  let mockJwtService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAuthRepository = {
      findByEmail: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    const validCredentials = {
      email: 'technician@lab.com',
      password: 'securePass123',
    };

    it('should return access token when credentials are valid', async () => {
      const user = {
        id: 1,
        email: 'technician@lab.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: true,
      };
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      const result = await service.login(validCredentials);

      expect(result).toEqual({ accessToken: 'jwt.token.here' });
    });

    it('should reject login when user does not exist', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(undefined);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validCredentials)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should reject login when password is incorrect', async () => {
      const user = {
        id: 1,
        email: 'technician@lab.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: true,
      };
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validCredentials)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should reject login when account is deactivated', async () => {
      const deactivatedUser = {
        id: 1,
        email: 'technician@lab.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: false,
      };
      mockAuthRepository.findByEmail.mockResolvedValue(deactivatedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validCredentials)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });
});
