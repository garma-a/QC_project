import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WorkerService } from './workers/worker.service';
import { EmailService } from '@/email/email.service';

// ─── Shared test fixtures ───────────────────────────────────────────────────

const ACTIVE_USER = {
  id: 1,
  email: 'tech@lab.com',
  firstName: 'Alice',
  lastName: 'Smith',
  passwordHash: 'hashed_password',
  role: 'TECHNICIAN',
  isActive: true,
};

const ADMIN_USER = {
  id: 99,
  email: 'admin@lab.com',
  firstName: 'Admin',
  lastName: 'User',
  passwordHash: 'hashed_admin_password',
  role: 'ADMIN',
  isActive: true,
};

// ─── Suite ─────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: jest.Mocked<Record<keyof AuthRepository, jest.Mock>>;
  let mockJwtService: Record<string, jest.Mock>;
  let mockWorkerService: Record<string, jest.Mock>;
  let mockConfigService: Record<string, jest.Mock>;
  let mockEmailService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updatePassword: jest.fn(),
      createUser: jest.fn(),
      isEmailWhitelisted: jest.fn(),
      addToWhitelist: jest.fn(),
      removeFromWhitelist: jest.fn(),
      getAllWhitelistedEmails: jest.fn(),
      saveOtp: jest.fn(),
      verifyOtp: jest.fn(),
      markOtpVerified: jest.fn(),
      isOtpVerified: jest.fn(),
      clearOtp: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      deleteAllRefreshTokens: jest.fn(),
    } as any;

    mockJwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    mockWorkerService = {
      verifyPassword: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('new_hashed_password'),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, def?: any) => {
        const config: Record<string, string> = {
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key] ?? def;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
        };
        if (config[key]) return config[key];
        throw new Error(`Config key "${key}" not found`);
      }),
    };

    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: WorkerService, useValue: mockWorkerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════════════════════════════════
  // login()
  // ══════════════════════════════════════════════════════════════════════════

  describe('login()', () => {
    const dto = { email: 'tech@lab.com', password: 'password123' };

    it('returns tokens when credentials are valid', async () => {
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER);
      mockWorkerService.verifyPassword.mockResolvedValue(true);
      mockRepo.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockWorkerService.verifyPassword).toHaveBeenCalledWith(
        ACTIVE_USER.passwordHash,
        dto.password,
      );
    });

    it('throws UnauthorizedException when user is not found', async () => {
      mockRepo.findByEmail.mockResolvedValue(undefined);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('throws UnauthorizedException when password is null (incomplete signup)', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...ACTIVE_USER, passwordHash: null });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Account setup is incomplete');
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER);
      mockWorkerService.verifyPassword.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });

    it('throws UnauthorizedException when account is deactivated', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...ACTIVE_USER, isActive: false });
      mockWorkerService.verifyPassword.mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Account is deactivated');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // initiateSignup() — Step 1
  // ══════════════════════════════════════════════════════════════════════════

  describe('initiateSignup()', () => {
    it('sends OTP and returns message when email is whitelisted and not registered', async () => {
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(undefined);
      mockRepo.saveOtp.mockResolvedValue(undefined);

      const result = await service.initiateSignup('  TECH@LAB.COM  ');

      expect(result.message).toMatch(/OTP sent/i);
      expect(mockRepo.isEmailWhitelisted).toHaveBeenCalledWith('tech@lab.com');
      expect(mockRepo.saveOtp).toHaveBeenCalledWith(
        'signup',
        'tech@lab.com',
        expect.stringMatching(/^\d{6}$/),
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'tech@lab.com',
        expect.stringContaining('OTP'),
        expect.any(String),
      );
    });

    it('normalises email to lowercase before processing', async () => {
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(undefined);
      mockRepo.saveOtp.mockResolvedValue(undefined);

      await service.initiateSignup('UPPERCASE@LAB.COM');

      expect(mockRepo.isEmailWhitelisted).toHaveBeenCalledWith('uppercase@lab.com');
    });

    it('throws BadRequestException when email is not whitelisted', async () => {
      mockRepo.isEmailWhitelisted.mockResolvedValue(false);

      await expect(service.initiateSignup('unknown@lab.com')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.initiateSignup('unknown@lab.com')).rejects.toThrow(
        'not authorised to register',
      );
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('throws ConflictException when account is already fully registered', async () => {
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER);

      await expect(service.initiateSignup(ACTIVE_USER.email)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.initiateSignup(ACTIVE_USER.email)).rejects.toThrow(
        'already exists',
      );
    });

    it('allows re-initiating signup when user row exists but has no password yet', async () => {
      // Admin may have pre-created the user without a password
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue({ ...ACTIVE_USER, passwordHash: null });
      mockRepo.saveOtp.mockResolvedValue(undefined);

      const result = await service.initiateSignup(ACTIVE_USER.email);

      expect(result.message).toMatch(/OTP sent/i);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // verifySignupOtp() — Step 2
  // ══════════════════════════════════════════════════════════════════════════

  describe('verifySignupOtp()', () => {
    const dto = { email: 'tech@lab.com', otp: '123456' };

    it('marks OTP verified and returns success message when OTP is correct', async () => {
      mockRepo.verifyOtp.mockResolvedValue(true);
      mockRepo.markOtpVerified.mockResolvedValue(undefined);

      const result = await service.verifySignupOtp(dto);

      expect(result.message).toMatch(/verified/i);
      expect(mockRepo.verifyOtp).toHaveBeenCalledWith('signup', 'tech@lab.com', '123456');
      expect(mockRepo.markOtpVerified).toHaveBeenCalledWith('signup', 'tech@lab.com');
    });

    it('throws BadRequestException when OTP is wrong', async () => {
      mockRepo.verifyOtp.mockResolvedValue(false);

      await expect(service.verifySignupOtp({ email: 'tech@lab.com', otp: 'wrong1' }))
        .rejects.toThrow(BadRequestException);
      await expect(service.verifySignupOtp({ email: 'tech@lab.com', otp: 'wrong1' }))
        .rejects.toThrow('Invalid or expired OTP');

      expect(mockRepo.markOtpVerified).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // completeSignup() — Step 3
  // ══════════════════════════════════════════════════════════════════════════

  describe('completeSignup()', () => {
    const dto = {
      email: 'tech@lab.com',
      firstName: 'Alice',
      lastName: 'Smith',
      password: 'StrongPass123!',
    };

    it('creates new user and returns tokens when OTP is verified', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(undefined);
      mockRepo.createUser.mockResolvedValue({ id: 5, role: 'TECHNICIAN' });
      mockRepo.clearOtp.mockResolvedValue(undefined);
      mockRepo.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.completeSignup(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockWorkerService.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(mockRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'tech@lab.com',
          firstName: 'Alice',
          lastName: 'Smith',
          role: 'TECHNICIAN',
          isActive: true,
        }),
      );
      expect(mockRepo.clearOtp).toHaveBeenCalledWith('signup', 'tech@lab.com');
    });

    it('updates password (not creates) when user row already exists without password', async () => {
      const existingUserNoPassword = { ...ACTIVE_USER, passwordHash: null };
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(existingUserNoPassword);
      mockRepo.updatePassword.mockResolvedValue({ ...ACTIVE_USER });
      mockRepo.clearOtp.mockResolvedValue(undefined);
      mockRepo.saveRefreshToken.mockResolvedValue(undefined);

      await service.completeSignup(dto);

      expect(mockRepo.updatePassword).toHaveBeenCalledWith(
        existingUserNoPassword.id,
        'new_hashed_password',
      );
      expect(mockRepo.createUser).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when OTP was never verified', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(false);

      await expect(service.completeSignup(dto)).rejects.toThrow(BadRequestException);
      await expect(service.completeSignup(dto)).rejects.toThrow('OTP not verified');

      expect(mockRepo.createUser).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when email is no longer whitelisted', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.isEmailWhitelisted.mockResolvedValue(false);

      await expect(service.completeSignup(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when account already has a password', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.isEmailWhitelisted.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER); // has passwordHash

      await expect(service.completeSignup(dto)).rejects.toThrow(ConflictException);
      await expect(service.completeSignup(dto)).rejects.toThrow('already exists');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // forgotPassword() — Step 1
  // ══════════════════════════════════════════════════════════════════════════

  describe('forgotPassword()', () => {
    const dto = { email: 'tech@lab.com' };

    it('sends reset OTP and returns generic message for registered active users', async () => {
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.saveOtp.mockResolvedValue(undefined);

      const result = await service.forgotPassword(dto);

      expect(result.message).toMatch(/OTP has been sent/i);
      expect(mockRepo.saveOtp).toHaveBeenCalledWith(
        'reset',
        'tech@lab.com',
        expect.stringMatching(/^\d{6}$/),
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('returns same generic message without sending OTP for unknown email (anti-enumeration)', async () => {
      mockRepo.findByEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword({ email: 'ghost@lab.com' });

      expect(result.message).toMatch(/OTP has been sent/i);
      expect(mockRepo.saveOtp).not.toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('returns same generic message without sending OTP for deactivated accounts', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...ACTIVE_USER, isActive: false });

      const result = await service.forgotPassword(dto);

      expect(result.message).toMatch(/OTP has been sent/i);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('returns same generic message for users who never completed signup', async () => {
      mockRepo.findByEmail.mockResolvedValue({ ...ACTIVE_USER, passwordHash: null });

      const result = await service.forgotPassword(dto);

      expect(result.message).toMatch(/OTP has been sent/i);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // verifyResetOtp() — Step 2
  // ══════════════════════════════════════════════════════════════════════════

  describe('verifyResetOtp()', () => {
    const dto = { email: 'tech@lab.com', otp: '654321' };

    it('marks OTP verified and returns success when OTP is correct', async () => {
      mockRepo.verifyOtp.mockResolvedValue(true);
      mockRepo.markOtpVerified.mockResolvedValue(undefined);

      const result = await service.verifyResetOtp(dto);

      expect(result.message).toMatch(/verified/i);
      expect(mockRepo.verifyOtp).toHaveBeenCalledWith('reset', 'tech@lab.com', '654321');
      expect(mockRepo.markOtpVerified).toHaveBeenCalledWith('reset', 'tech@lab.com');
    });

    it('throws BadRequestException when reset OTP is wrong', async () => {
      mockRepo.verifyOtp.mockResolvedValue(false);

      await expect(service.verifyResetOtp({ email: 'tech@lab.com', otp: 'bad000' }))
        .rejects.toThrow(BadRequestException);
      await expect(service.verifyResetOtp({ email: 'tech@lab.com', otp: 'bad000' }))
        .rejects.toThrow('Invalid or expired OTP');

      expect(mockRepo.markOtpVerified).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // resetPassword() — Step 3
  // ══════════════════════════════════════════════════════════════════════════

  describe('resetPassword()', () => {
    const dto = { email: 'tech@lab.com', newPassword: 'NewStrong123!' };

    it('updates password, revokes all tokens, clears OTP on success', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER);
      mockRepo.updatePassword.mockResolvedValue(ACTIVE_USER);
      mockRepo.deleteAllRefreshTokens.mockResolvedValue(undefined);
      mockRepo.clearOtp.mockResolvedValue(undefined);

      const result = await service.resetPassword(dto);

      expect(result.message).toMatch(/Password updated/i);
      expect(mockWorkerService.hashPassword).toHaveBeenCalledWith(dto.newPassword);
      expect(mockRepo.updatePassword).toHaveBeenCalledWith(
        ACTIVE_USER.id,
        'new_hashed_password',
      );
      expect(mockRepo.deleteAllRefreshTokens).toHaveBeenCalledWith(ACTIVE_USER.id);
      expect(mockRepo.clearOtp).toHaveBeenCalledWith('reset', 'tech@lab.com');
    });

    it('throws BadRequestException when reset OTP was never verified', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(false);

      await expect(service.resetPassword(dto)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(dto)).rejects.toThrow('OTP not verified');

      expect(mockRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user does not exist after OTP check', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue(undefined);

      await expect(service.resetPassword(dto)).rejects.toThrow(NotFoundException);
      await expect(service.resetPassword(dto)).rejects.toThrow('User not found');
    });

    it('throws NotFoundException when user is deactivated', async () => {
      mockRepo.isOtpVerified.mockResolvedValue(true);
      mockRepo.findByEmail.mockResolvedValue({ ...ACTIVE_USER, isActive: false });

      await expect(service.resetPassword(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // addEmailToWhitelist()
  // ══════════════════════════════════════════════════════════════════════════

  describe('addEmailToWhitelist()', () => {
    it('adds email and returns entry when not already registered or whitelisted', async () => {
      const entry = { id: 1, email: 'new@lab.com', createdAt: new Date().toISOString() };
      mockRepo.findByEmail.mockResolvedValue(undefined);
      mockRepo.addToWhitelist.mockResolvedValue(entry);

      const result = await service.addEmailToWhitelist('new@lab.com', ADMIN_USER.id);

      expect(result).toEqual(entry);
      expect(mockRepo.addToWhitelist).toHaveBeenCalledWith('new@lab.com', ADMIN_USER.id);
    });

    it('normalises email to lowercase', async () => {
      mockRepo.findByEmail.mockResolvedValue(undefined);
      mockRepo.addToWhitelist.mockResolvedValue({ id: 2, email: 'tech@lab.com' });

      await service.addEmailToWhitelist('TECH@LAB.COM', ADMIN_USER.id);

      expect(mockRepo.addToWhitelist).toHaveBeenCalledWith('tech@lab.com', ADMIN_USER.id);
    });

    it('throws ConflictException when user with that email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(ACTIVE_USER);

      await expect(service.addEmailToWhitelist(ACTIVE_USER.email, ADMIN_USER.id))
        .rejects.toThrow(ConflictException);
      await expect(service.addEmailToWhitelist(ACTIVE_USER.email, ADMIN_USER.id))
        .rejects.toThrow('user with this email already exists');
    });

    it('throws ConflictException when email is already on the whitelist (DB conflict)', async () => {
      mockRepo.findByEmail.mockResolvedValue(undefined);
      mockRepo.addToWhitelist.mockResolvedValue(undefined); // onConflictDoNothing returns undefined

      await expect(service.addEmailToWhitelist('dup@lab.com', ADMIN_USER.id))
        .rejects.toThrow(ConflictException);
      await expect(service.addEmailToWhitelist('dup@lab.com', ADMIN_USER.id))
        .rejects.toThrow('already on the whitelist');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // removeEmailFromWhitelist()
  // ══════════════════════════════════════════════════════════════════════════

  describe('removeEmailFromWhitelist()', () => {
    it('removes email and returns success message', async () => {
      mockRepo.removeFromWhitelist.mockResolvedValue({ id: 1, email: 'tech@lab.com' });

      const result = await service.removeEmailFromWhitelist('tech@lab.com');

      expect(result.message).toMatch(/removed/i);
      expect(mockRepo.removeFromWhitelist).toHaveBeenCalledWith('tech@lab.com');
    });

    it('throws NotFoundException when email is not on the whitelist', async () => {
      mockRepo.removeFromWhitelist.mockResolvedValue(undefined);

      await expect(service.removeEmailFromWhitelist('ghost@lab.com'))
        .rejects.toThrow(NotFoundException);
      await expect(service.removeEmailFromWhitelist('ghost@lab.com'))
        .rejects.toThrow('not found on the whitelist');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // refreshTokens()
  // ══════════════════════════════════════════════════════════════════════════

  describe('refreshTokens()', () => {
    it('issues new tokens when refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ userId: 1, role: 'TECHNICIAN', jti: 'test-jti' });
      mockRepo.findRefreshToken.mockResolvedValue({ jti: 'test-jti', userId: 1 });
      mockRepo.deleteRefreshToken.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue(ACTIVE_USER);
      mockRepo.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshTokens('old-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockRepo.deleteRefreshToken).toHaveBeenCalledWith('test-jti');
    });

    it('throws UnauthorizedException when JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('expired'); });

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshTokens('bad-token')).rejects.toThrow('Invalid refresh token');
    });

    it('throws UnauthorizedException and revokes all tokens when jti is not in cache (replay)', async () => {
      mockJwtService.verify.mockReturnValue({ userId: 1, jti: 'revoked-jti' });
      mockRepo.findRefreshToken.mockResolvedValue(null);
      mockRepo.deleteAllRefreshTokens.mockResolvedValue(undefined);

      await expect(service.refreshTokens('replayed-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshTokens('replayed-token')).rejects.toThrow('revoked or already used');

      expect(mockRepo.deleteAllRefreshTokens).toHaveBeenCalledWith(1);
    });

    it('throws UnauthorizedException when user is deactivated', async () => {
      mockJwtService.verify.mockReturnValue({ userId: 1, jti: 'test-jti' });
      mockRepo.findRefreshToken.mockResolvedValue({ jti: 'test-jti', userId: 1 });
      mockRepo.deleteRefreshToken.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue({ ...ACTIVE_USER, isActive: false });

      await expect(service.refreshTokens('valid-refresh-token'))
        .rejects.toThrow(UnauthorizedException);
      await expect(service.refreshTokens('valid-refresh-token'))
        .rejects.toThrow('User is inactive');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // logout()
  // ══════════════════════════════════════════════════════════════════════════

  describe('logout()', () => {
    it('deletes refresh token from cache when JWT decodes successfully', async () => {
      mockJwtService.decode.mockReturnValue({ jti: 'logout-jti' });
      mockRepo.deleteRefreshToken.mockResolvedValue(undefined);

      await service.logout('valid-refresh-token');

      expect(mockRepo.deleteRefreshToken).toHaveBeenCalledWith('logout-jti');
    });
    it('does not throw when token is invalid/malformed (graceful logout)', async () => {
      mockJwtService.decode.mockReturnValue(null);

      await service.logout('garbage-token');
      expect(mockRepo.deleteRefreshToken).not.toHaveBeenCalled();
    });
  });
});
