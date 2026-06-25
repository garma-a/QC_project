import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { LoginDto } from '@/auth/dto/login.dto';
import { AuthRepository } from './auth.repository';
import { WorkerService } from './workers/worker.service';
import { EmailService } from '@/email/email.service';
import { otpEmailTemplate } from '@/email/email.templates';
import type {
  CompleteSignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
  VerifySignupOtpDto,
} from './dto/otp.dto';

function generateOtp(): string {
  // Cryptographically random 6-digit OTP
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly workerService: WorkerService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) { }

  // ─── Login ─────────────────────────────────────────────────────────────

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Account setup is incomplete. Please complete your registration.');

    const passwordMatches = await this.workerService.verifyPassword(
      user.passwordHash,
      loginDto.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.issueTokens(user.id, user.role);
  }

  // ─── Signup flow ───────────────────────────────────────────────────────

  /**
   * Step 1: Check if email is on the whitelist and not already registered,
   * then send an OTP to that email.
   */
  async initiateSignup(email: string) {
    const normalised = email.toLowerCase().trim();

    const whitelisted = await this.authRepository.isEmailWhitelisted(normalised);
    if (!whitelisted) {
      throw new BadRequestException(
        'This email is not authorised to register. Please contact your administrator.',
      );
    }

    const existing = await this.authRepository.findByEmail(normalised);
    if (existing && existing.passwordHash) {
      throw new ConflictException(
        'An account with this email already exists. Please log in.',
      );
    }

    const otp = generateOtp();
    await this.authRepository.saveOtp('signup', normalised, otp);

    const html = otpEmailTemplate({ otp, purpose: 'signup' });
    await this.emailService.sendEmail(normalised, 'Your QC System Registration OTP', html);

    return { message: 'OTP sent to your email. It is valid for 10 minutes.' };
  }

  /**
   * Step 2: Verify the signup OTP.
   */
  async verifySignupOtp(dto: VerifySignupOtpDto) {
    const normalised = dto.email.toLowerCase().trim();
    const valid = await this.authRepository.verifyOtp('signup', normalised, dto.otp);
    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    // Mark as verified so the complete-signup step knows OTP was confirmed
    await this.authRepository.markOtpVerified('signup', normalised);
    return { message: 'OTP verified. You can now complete your registration.' };
  }

  /**
   * Step 3: Complete signup — set name + password.
   */
  async completeSignup(dto: CompleteSignupDto) {
    const normalised = dto.email.toLowerCase().trim();

    const otpVerified = await this.authRepository.isOtpVerified('signup', normalised);
    if (!otpVerified) {
      throw new BadRequestException('Email OTP not verified. Please start the registration process again.');
    }

    const whitelisted = await this.authRepository.isEmailWhitelisted(normalised);
    if (!whitelisted) {
      throw new BadRequestException('This email is not authorised to register.');
    }

    const existing = await this.authRepository.findByEmail(normalised);
    if (existing && existing.passwordHash) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashedPassword = await this.workerService.hashPassword(dto.password);

    let userId: number;
    let userRole: string;

    if (existing) {
      // User row already exists (admin pre-created) — just set the password
      await this.authRepository.updatePassword(existing.id, hashedPassword);
      userId = existing.id;
      userRole = existing.role;
    } else {
      // Create a new user row
      const newUser = await this.authRepository.createUser({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: normalised,
        passwordHash: hashedPassword,
        role: 'TECHNICIAN',
        isActive: true,
      });
      userId = newUser.id;
      userRole = newUser.role;
    }

    // Clean up OTP
    await this.authRepository.clearOtp('signup', normalised);

    return this.issueTokens(userId, userRole);
  }

  // ─── Forgot password flow ──────────────────────────────────────────────

  /**
   * Step 1: Send password-reset OTP to a registered email.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const normalised = dto.email.toLowerCase().trim();
    const user = await this.authRepository.findByEmail(normalised);

    // Always return success to avoid user enumeration
    if (!user || !user.isActive || !user.passwordHash) {
      return { message: 'If this email is registered, an OTP has been sent.' };
    }

    const otp = generateOtp();
    await this.authRepository.saveOtp('reset', normalised, otp);

    const html = otpEmailTemplate({
      otp,
      purpose: 'reset-password',
      firstName: user.firstName,
    });
    await this.emailService.sendEmail(normalised, 'Your QC System Password Reset OTP', html);

    return { message: 'If this email is registered, an OTP has been sent.' };
  }

  /**
   * Step 2: Verify the password-reset OTP.
   */
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const normalised = dto.email.toLowerCase().trim();
    const valid = await this.authRepository.verifyOtp('reset', normalised, dto.otp);
    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    await this.authRepository.markOtpVerified('reset', normalised);
    return { message: 'OTP verified. You can now set your new password.' };
  }

  /**
   * Step 3: Set the new password after OTP verification.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const normalised = dto.email.toLowerCase().trim();

    const otpVerified = await this.authRepository.isOtpVerified('reset', normalised);
    if (!otpVerified) {
      throw new BadRequestException('OTP not verified. Please start the password reset process again.');
    }

    const user = await this.authRepository.findByEmail(normalised);
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or account is inactive.');
    }

    const hashedPassword = await this.workerService.hashPassword(dto.newPassword);
    await this.authRepository.updatePassword(user.id, hashedPassword);

    // Revoke all existing refresh tokens (security hygiene after password reset)
    await this.authRepository.deleteAllRefreshTokens(user.id);

    // Clear OTP
    await this.authRepository.clearOtp('reset', normalised);

    return { message: 'Password updated successfully. You can now log in.' };
  }

  // ─── Token refresh & logout ────────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const tokenRecord = await this.authRepository.findRefreshToken(payload.jti);
    if (!tokenRecord) {
      // Possible token reuse / replay attack. 
      // In a strict implementation, we would revoke all tokens for this user:
      await this.authRepository.deleteAllRefreshTokens(payload.userId);
      throw new UnauthorizedException('Refresh token has been revoked or already used');
    }

    // Delete the old token (token rotation)
    await this.authRepository.deleteRefreshToken(payload.jti);

    const user = await this.authRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or invalid');
    }

    return this.issueTokens(user.id, user.role);
  }

  async logout(refreshToken: string) {
    try {
      // Use decode so we can clean up even if the token is expired
      const payload = this.jwtService.decode(refreshToken) as any;
      if (payload && payload.jti) {
        await this.authRepository.deleteRefreshToken(payload.jti);
      }
    } catch (e) {
      // Ignore decode errors on logout
    }
  }

  // ─── Whitelist management (admin) ──────────────────────────────────────

  async addEmailToWhitelist(email: string, adminId: number) {
    const normalised = email.toLowerCase().trim();
    const existing = await this.authRepository.findByEmail(normalised);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }
    const entry = await this.authRepository.addToWhitelist(normalised, adminId);
    if (!entry) {
      throw new ConflictException('This email is already on the whitelist.');
    }
    return entry;
  }

  async removeEmailFromWhitelist(email: string) {
    const normalised = email.toLowerCase().trim();
    const entry = await this.authRepository.removeFromWhitelist(normalised);
    if (!entry) {
      throw new NotFoundException('Email not found on the whitelist.');
    }
    return { message: 'Email removed from whitelist.' };
  }

  async getWhitelistedEmails() {
    return this.authRepository.getAllWhitelistedEmails();
  }

  // ─── Private helpers ───────────────────────────────────────────────────

  private async issueTokens(userId: number, role: string) {
    const payload = { userId, role };
    const jti = randomUUID();
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign({ ...payload, jti }, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.authRepository.saveRefreshToken(userId, jti, expiresAt);

    return { accessToken, refreshToken };
  }
}
