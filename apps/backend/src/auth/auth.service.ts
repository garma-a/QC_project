import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/auth/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService, private jwtService: JwtService) { }

  async login(loginDto: LoginDto) {

    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, loginDto.email));

    if (!user) throw new UnauthorizedException('Invalid credentials');


    const passwordMatches = await argon2.verify(user.passwordHash, loginDto.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = { userId: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
