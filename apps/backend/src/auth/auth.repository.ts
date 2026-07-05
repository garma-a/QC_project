import { DatabaseService } from '@/database/database.service';
import { users, whitelistEmails } from '@/drizzle/schema';
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { eq } from 'drizzle-orm';

const OTP_TTL = 10 * 60 * 1000; // 10 minutes in ms

@Injectable()
export class AuthRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  // ─── User lookup ───────────────────────────────────────────────────────

  async findByEmail(email: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email)).limit(1);
    return user;
  }

  async findById(id: number) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async updatePassword(id: number, passwordHash: string) {
    const [user] = await this.databaseService.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    role: 'TECHNICIAN' | 'ADMIN';
    isActive: boolean;
  }) {
    const [newUser] = await this.databaseService.db
      .insert(users)
      .values(data)
      .returning();
    return newUser;
  }

  // ─── Whitelist ─────────────────────────────────────────────────────────

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const [entry] = await this.databaseService.db
      .select()
      .from(whitelistEmails)
      .where(eq(whitelistEmails.email, email.toLowerCase()));
    return !!entry;
  }

  async addToWhitelist(email: string, addedBy?: number) {
    const [entry] = await this.databaseService.db
      .insert(whitelistEmails)
      .values({ email: email.toLowerCase(), addedBy })
      .onConflictDoNothing()
      .returning();
    return entry;
  }

  async removeFromWhitelist(email: string) {
    const [entry] = await this.databaseService.db
      .delete(whitelistEmails)
      .where(eq(whitelistEmails.email, email.toLowerCase()))
      .returning();
    return entry;
  }

  async getAllWhitelistedEmails() {
    return await this.databaseService.db
      .select()
      .from(whitelistEmails)
      .orderBy(whitelistEmails.createdAt);
  }

  // ─── OTP management ────────────────────────────────────────────────────

  private otpKey(type: 'signup' | 'reset', email: string) {
    return `otp:${type}:${email.toLowerCase()}`;
  }

  /** Store a 6-digit OTP in cache for 10 minutes */
  async saveOtp(type: 'signup' | 'reset', email: string, otp: string) {
    await this.cacheManager.set(this.otpKey(type, email), otp, OTP_TTL);
  }

  async verifyOtp(type: 'signup' | 'reset', email: string, otp: string): Promise<boolean> {
    const stored = await this.cacheManager.get<string>(this.otpKey(type, email));
    return stored === otp;
  }

  /** Mark OTP as verified (replace value so it can only be used once) */
  async markOtpVerified(type: 'signup' | 'reset', email: string) {
    // We store a sentinel so the reset-password step can confirm OTP was verified
    await this.cacheManager.set(
      this.otpKey(type, email),
      '__verified__',
      OTP_TTL,
    );
  }

  async isOtpVerified(type: 'signup' | 'reset', email: string): Promise<boolean> {
    const val = await this.cacheManager.get<string>(this.otpKey(type, email));
    return val === '__verified__';
  }

  async clearOtp(type: 'signup' | 'reset', email: string) {
    await this.cacheManager.del(this.otpKey(type, email));
  }

  // ─── Refresh token management ──────────────────────────────────────────

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
