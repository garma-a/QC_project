import { DatabaseService } from '@/database/database.service';
import { users, refreshTokens } from '@/drizzle/schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) { }

  async findByEmail(email: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async findById(id: number) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async saveRefreshToken(userId: number, jti: string, expiresAt: Date) {
    await this.databaseService.db.insert(refreshTokens).values({
      userId,
      jti,
      expiresAt,
    });
  }

  async findRefreshToken(jti: string) {
    const [token] = await this.databaseService.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.jti, jti));
    return token;
  }

  async deleteRefreshToken(jti: string) {
    await this.databaseService.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.jti, jti));
  }

  async deleteAllRefreshTokens(userId: number) {
    await this.databaseService.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }
}
