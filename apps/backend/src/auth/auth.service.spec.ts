import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { WorkerService } from './workers/worker.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthRepository: Record<string, jest.Mock>;
  let mockJwtService: Record<string, jest.Mock>;
  let mockWorkerService: Record<string, jest.Mock>;
  let mockConfigService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAuthRepository = {
      findByEmail: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    mockWorkerService = {
      verifyPassword: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'JWT_REFRESH_SECRET') return 'anyrefreshsecret';
        return defaultValue;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'anyrefreshsecret';
        throw new Error(`Configuration key "${key}" does not exist`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: WorkerService, useValue: mockWorkerService },
        { provide: ConfigService, useValue: mockConfigService },
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
      // Arrange
      const user = {
        id: 1,
        email: 'technician@lab.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: true,
      };
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      mockWorkerService.verifyPassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt.token.here');

      // Act
      const result = await service.login(validCredentials);

      // Assert
      expect(result).toEqual({ accessToken: 'jwt.token.here', refreshToken: 'jwt.token.here' });
    });

    it('should reject login when user does not exist', async () => {
      // Arrange
      mockAuthRepository.findByEmail.mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validCredentials)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should reject login when password is incorrect', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'technician@lab.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: true,
      };
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      mockWorkerService.verifyPassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validCredentials)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should reject login when account is deactivated', async () => {
      // Arrange
      const deactivatedUser = {
        id: 1,
        email: 'technician@lab.com',
        passwordHash: 'hashed_password',
        role: 'TECHNICIAN',
        isActive: false,
      };
      mockAuthRepository.findByEmail.mockResolvedValue(deactivatedUser);
      mockWorkerService.verifyPassword.mockResolvedValue(true);

      // Act & Assert
      await expect(service.login(validCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(validCredentials)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });
});
