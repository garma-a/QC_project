import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { LoginDto } from '@/auth/dto/login.dto';
import { AuthRepository } from './auth.repository';
import { WorkerService } from './workers/worker.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly workerService: WorkerService,
    private readonly configService: ConfigService,
  ) { }

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await this.workerService.verifyPassword(
      user.passwordHash,
      loginDto.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = { userId: user.id, role: user.role };
    
    const jti = randomUUID();
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign({ ...payload, jti }, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.authRepository.saveRefreshToken(user.id, jti, expiresAt);

    return { accessToken, refreshToken };
  }

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
      // await this.authRepository.deleteAllRefreshTokens(payload.userId);
      throw new UnauthorizedException('Refresh token has been revoked or already used');
    }

    // Delete the old token (token rotation)
    await this.authRepository.deleteRefreshToken(payload.jti);

    const user = await this.authRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or invalid');
    }

    const newPayload = { userId: user.id, role: user.role };
    const newJti = randomUUID();
    const newAccessToken = this.jwtService.sign(newPayload);
    const newRefreshToken = this.jwtService.sign({ ...newPayload, jti: newJti }, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.authRepository.saveRefreshToken(user.id, newJti, expiresAt);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.jti) {
        await this.authRepository.deleteRefreshToken(payload.jti);
      }
    } catch (e) {
      // Ignore verification errors on logout
    }
  }
}
