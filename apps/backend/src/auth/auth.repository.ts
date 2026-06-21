import { DatabaseService } from '@/database/database.service';
import { users } from '@/drizzle/schema';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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
    // calculate ttl in milliseconds
    const ttl = Math.max(0, expiresAt.getTime() - Date.now());
    
    // save token mapping: jti -> userId
    await this.cacheManager.set(`refresh_token:${jti}`, userId, ttl);
    
    // add to user's tokens list
    const userTokensKey = `user_tokens:${userId}`;
    const userTokens = await this.cacheManager.get<string[]>(userTokensKey) || [];
    userTokens.push(jti);
    // User tokens list can live for the maximum duration of a refresh token (7 days)
    await this.cacheManager.set(userTokensKey, userTokens, 7 * 24 * 60 * 60 * 1000);
  }

  async findRefreshToken(jti: string) {
    const userId = await this.cacheManager.get<number>(`refresh_token:${jti}`);
    if (!userId) return null;
    return { jti, userId };
  }

  async deleteRefreshToken(jti: string) {
    const userId = await this.cacheManager.get<number>(`refresh_token:${jti}`);
    if (userId) {
      // Remove from user's tokens list
      const userTokensKey = `user_tokens:${userId}`;
      let userTokens = await this.cacheManager.get<string[]>(userTokensKey) || [];
      userTokens = userTokens.filter(t => t !== jti);
      await this.cacheManager.set(userTokensKey, userTokens, 7 * 24 * 60 * 60 * 1000);
    }
    await this.cacheManager.del(`refresh_token:${jti}`);
  }

  async deleteAllRefreshTokens(userId: number) {
    const userTokensKey = `user_tokens:${userId}`;
    const userTokens = await this.cacheManager.get<string[]>(userTokensKey) || [];
    
    // Delete all individual tokens
    for (const jti of userTokens) {
      await this.cacheManager.del(`refresh_token:${jti}`);
    }
    
    // Delete the user tokens list
    await this.cacheManager.del(userTokensKey);
  }
}
