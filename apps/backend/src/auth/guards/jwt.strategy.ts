import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@/auth/auth.types';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '@/auth/auth.repository';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is invalid or inactive');
    }
    return { userId: payload.userId, role: payload.role };
  }
}
