import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthRepository } from './auth.repository';
import { DatabaseService } from '@/database/database.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simple in-memory cache that mirrors cache-manager's interface */
function makeInMemoryCache() {
  const store = new Map<string, { value: unknown; expiresAt: number }>();

  return {
    store,
    async set(key: string, value: unknown, ttl?: number) {
      store.set(key, { value, expiresAt: Date.now() + (ttl ?? 60_000) });
    },
    async get<T>(key: string): Promise<T | undefined> {
      const entry = store.get(key);
      if (!entry || entry.expiresAt < Date.now()) return undefined;
      return entry.value as T;
    },
    async del(key: string) {
      store.delete(key);
    },
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthRepository — OTP & token cache methods', () => {
  let repo: AuthRepository;
  let cache: ReturnType<typeof makeInMemoryCache>;

  // We only test cache-backed methods here; DB methods are covered by
  // integration tests. We supply a no-op mock for DatabaseService.
  const mockDb = {
    db: {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      onConflictDoNothing: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    cache = makeInMemoryCache();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        { provide: DatabaseService, useValue: mockDb },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    repo = module.get<AuthRepository>(AuthRepository);
  });

  afterEach(() => cache.store.clear());

  // ══════════════════════════════════════════════════════════════════════════
  // OTP lifecycle
  // ══════════════════════════════════════════════════════════════════════════

  describe('saveOtp / verifyOtp', () => {
    it('returns true when the saved OTP matches', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      const valid = await repo.verifyOtp('signup', 'user@lab.com', '123456');
      expect(valid).toBe(true);
    });

    it('returns false when the OTP does not match', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      const valid = await repo.verifyOtp('signup', 'user@lab.com', '999999');
      expect(valid).toBe(false);
    });

    it('returns false when no OTP has been saved', async () => {
      const valid = await repo.verifyOtp('signup', 'nobody@lab.com', '000000');
      expect(valid).toBe(false);
    });

    it('scopes OTPs by type — signup and reset keys are independent', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '111111');
      await repo.saveOtp('reset', 'user@lab.com', '222222');

      expect(await repo.verifyOtp('signup', 'user@lab.com', '111111')).toBe(true);
      expect(await repo.verifyOtp('reset', 'user@lab.com', '222222')).toBe(true);

      // Cross-type check must fail
      expect(await repo.verifyOtp('signup', 'user@lab.com', '222222')).toBe(false);
      expect(await repo.verifyOtp('reset', 'user@lab.com', '111111')).toBe(false);
    });

    it('normalises email to lowercase for the cache key', async () => {
      await repo.saveOtp('signup', 'USER@LAB.COM', '654321');
      const valid = await repo.verifyOtp('signup', 'user@lab.com', '654321');
      expect(valid).toBe(true);
    });
  });

  describe('markOtpVerified / isOtpVerified', () => {
    it('isOtpVerified returns false before marking', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      const verified = await repo.isOtpVerified('signup', 'user@lab.com');
      expect(verified).toBe(false);
    });

    it('isOtpVerified returns true after markOtpVerified is called', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      await repo.markOtpVerified('signup', 'user@lab.com');
      const verified = await repo.isOtpVerified('signup', 'user@lab.com');
      expect(verified).toBe(true);
    });

    it('verifyOtp returns false after marking (sentinel ≠ original OTP)', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      await repo.markOtpVerified('signup', 'user@lab.com');
      // The OTP value is now replaced by '__verified__', so original OTP no longer works
      const valid = await repo.verifyOtp('signup', 'user@lab.com', '123456');
      expect(valid).toBe(false);
    });

    it('isOtpVerified is false for reset type when only signup is verified', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '111111');
      await repo.markOtpVerified('signup', 'user@lab.com');

      const resetVerified = await repo.isOtpVerified('reset', 'user@lab.com');
      expect(resetVerified).toBe(false);
    });
  });

  describe('clearOtp', () => {
    it('removes the OTP so verifyOtp returns false', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      await repo.clearOtp('signup', 'user@lab.com');

      const valid = await repo.verifyOtp('signup', 'user@lab.com', '123456');
      expect(valid).toBe(false);
    });

    it('removes the verified sentinel so isOtpVerified returns false', async () => {
      await repo.saveOtp('signup', 'user@lab.com', '123456');
      await repo.markOtpVerified('signup', 'user@lab.com');
      await repo.clearOtp('signup', 'user@lab.com');

      const verified = await repo.isOtpVerified('signup', 'user@lab.com');
      expect(verified).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Refresh token lifecycle
  // ══════════════════════════════════════════════════════════════════════════

  describe('saveRefreshToken / findRefreshToken', () => {
    it('stores a token and retrieves it by JTI', async () => {
      const expiresAt = new Date(Date.now() + 60_000);
      await repo.saveRefreshToken(1, 'jti-abc', expiresAt);

      const found = await repo.findRefreshToken('jti-abc');
      expect(found).not.toBeNull();
      expect(found?.userId).toBe(1);
      expect(found?.jti).toBe('jti-abc');
    });

    it('returns null for unknown JTI', async () => {
      const found = await repo.findRefreshToken('non-existent-jti');
      expect(found).toBeNull();
    });

    it('stores multiple tokens for the same user', async () => {
      const exp = new Date(Date.now() + 60_000);
      await repo.saveRefreshToken(1, 'jti-1', exp);
      await repo.saveRefreshToken(1, 'jti-2', exp);

      expect(await repo.findRefreshToken('jti-1')).not.toBeNull();
      expect(await repo.findRefreshToken('jti-2')).not.toBeNull();
    });
  });

  describe('deleteRefreshToken', () => {
    it('removes the token so findRefreshToken returns null', async () => {
      const exp = new Date(Date.now() + 60_000);
      await repo.saveRefreshToken(1, 'jti-del', exp);

      await repo.deleteRefreshToken('jti-del');

      const found = await repo.findRefreshToken('jti-del');
      expect(found).toBeNull();
    });
    it('does not throw when deleting a non-existent token', async () => {
      // If no exception is thrown, the test naturally passes.
      await repo.deleteRefreshToken('jti-ghost');
    });
  });

  describe('deleteAllRefreshTokens', () => {
    it('removes all tokens for a user', async () => {
      const exp = new Date(Date.now() + 60_000);
      await repo.saveRefreshToken(42, 'jti-a', exp);
      await repo.saveRefreshToken(42, 'jti-b', exp);
      await repo.saveRefreshToken(42, 'jti-c', exp);

      await repo.deleteAllRefreshTokens(42);

      expect(await repo.findRefreshToken('jti-a')).toBeNull();
      expect(await repo.findRefreshToken('jti-b')).toBeNull();
      expect(await repo.findRefreshToken('jti-c')).toBeNull();
    });

    it('does not affect tokens for other users', async () => {
      const exp = new Date(Date.now() + 60_000);
      await repo.saveRefreshToken(1, 'user1-jti', exp);
      await repo.saveRefreshToken(2, 'user2-jti', exp);

      await repo.deleteAllRefreshTokens(1);

      expect(await repo.findRefreshToken('user1-jti')).toBeNull();
      expect(await repo.findRefreshToken('user2-jti')).not.toBeNull();
    });
  });
});
