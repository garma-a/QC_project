import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/auth/dto/login.dto';
import { AuthRepository } from './auth.repository';
import { WorkerService } from './workers/worker.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly workerService: WorkerService,
  ) {}

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
    return { accessToken: this.jwtService.sign(payload) };
  }
}
