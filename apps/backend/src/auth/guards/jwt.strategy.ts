import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, RequestUser, Role } from '@/auth/auth.types';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '@/auth/auth.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const cacheKey = `user_status_${payload.userId}`;
    const cachedUser = await this.cacheManager.get<{ isActive: boolean; role: Role }>(cacheKey);

    if (cachedUser) {
      if (!cachedUser.isActive) {
        throw new UnauthorizedException('User is inactive');
      }
      return { userId: payload.userId, role: cachedUser.role };
    }

    const user = await this.authRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User is invalid');
    }

    const minimalUser = { isActive: user.isActive ?? false, role: user.role as Role };
    // Note: cache-manager v5+ uses milliseconds for ttl, older versions used seconds.
    // NestJS cache-manager defaults to ms, so we pass 300000ms.
    await this.cacheManager.set(cacheKey, minimalUser, 300000);

    if (!minimalUser.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    return { userId: payload.userId, role: minimalUser.role };
  }
}
