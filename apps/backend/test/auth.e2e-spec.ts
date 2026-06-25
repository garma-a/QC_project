import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from '@/database/database.service';
import { users, whitelistEmails } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { WorkerService } from '@/auth/workers/worker.service';

const TEST_EMAIL = `test_${crypto.randomBytes(4).toString('hex')}@lab.com`;
const LOGIN_EMAIL = `login_${crypto.randomBytes(4).toString('hex')}@lab.com`;
const TEST_PASSWORD = 'StrongPassword123!';
let adminJwt: string;
let adminId: number;

describe('AuthController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let db: DatabaseService;
  let cache: Cache;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    db = app.get<DatabaseService>(DatabaseService);
    cache = app.get<Cache>(CACHE_MANAGER);

    // Create admin user for JWT
    const adminEmail = `admin_${crypto.randomBytes(4).toString('hex')}@lab.com`;
    const adminUser = await db.db.insert(users).values({
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: 'dummy',
      role: 'ADMIN',
      isActive: true,
    }).returning();
    
    adminId = adminUser[0].id;
    const jwtService = app.get<JwtService>(JwtService);
    adminJwt = jwtService.sign({ userId: adminId, role: 'ADMIN' });

    // Pre-seed a user for the login tests so they don't depend on signup
    const worker = app.get<WorkerService>(WorkerService);
    const hash = await worker.hashPassword(TEST_PASSWORD);
    await db.db.insert(users).values({
      email: LOGIN_EMAIL,
      firstName: 'Login',
      lastName: 'User',
      passwordHash: hash,
      role: 'TECHNICIAN',
      isActive: true,
    });
  });

  afterAll(async () => {
    await db.db.delete(users).where(eq(users.email, TEST_EMAIL));
    await db.db.delete(users).where(eq(users.email, LOGIN_EMAIL));
    await db.db.delete(whitelistEmails).where(eq(whitelistEmails.email, TEST_EMAIL));
    if (adminId) {
      await db.db.delete(users).where(eq(users.id, adminId));
    }
    await app.close();
  });

  describe('Whitelist Management', () => {
    it('POST /auth/whitelist - blocks non-admins', async () => {
      const jwtService = app.get<JwtService>(JwtService);
      const loginUser = await db.db.select().from(users).where(eq(users.email, LOGIN_EMAIL));
      const techJwt = jwtService.sign({ userId: loginUser[0].id, role: 'TECHNICIAN' });

      await request(app.getHttpServer())
        .post('/auth/whitelist')
        .set('Authorization', `Bearer ${techJwt}`)
        .send({ email: TEST_EMAIL })
        .expect(403);
    });

    it('POST /auth/whitelist - adds email successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/whitelist')
        .set('Authorization', `Bearer ${adminJwt}`)
        .send({ email: TEST_EMAIL })
        .expect(201);
    });
  });

  describe('Signup Flow', () => {
    it('POST /auth/signup/check-email - blocks non-whitelisted emails', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup/check-email')
        .send({ email: 'ghost@lab.com' })
        .expect(400);
    });

    it('POST /auth/signup/check-email - sends OTP for whitelisted email', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup/check-email')
        .send({ email: TEST_EMAIL })
        .expect(201);
    });

    it('POST /auth/signup/verify-otp - accepts correct OTP by seeding cache', async () => {
      // Manually seed cache so we don't need to read the generated random one
      await cache.set(`otp:signup:${TEST_EMAIL}`, '123456', 60000);

      await request(app.getHttpServer())
        .post('/auth/signup/verify-otp')
        .send({ email: TEST_EMAIL, otp: '123456' })
        .expect(201);
    });

    it('POST /auth/signup/complete - completes signup and returns tokens', async () => {
      // Manually set the "verified" state in cache
      await cache.set(`otp:signup:${TEST_EMAIL}`, '__verified__', 60000);

      const res = await request(app.getHttpServer())
        .post('/auth/signup/complete')
        .send({
          email: TEST_EMAIL,
          firstName: 'E2E',
          lastName: 'TestUser',
          password: TEST_PASSWORD,
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe('Login & Token Refresh', () => {
    let activeRefreshToken: string;

    it('POST /auth/login - succeeds with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: LOGIN_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      activeRefreshToken = res.body.refreshToken;
    });

    it('POST /auth/refresh - issues new tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: activeRefreshToken })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      activeRefreshToken = res.body.refreshToken;
    });

    it('POST /auth/logout - succeeds', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: activeRefreshToken })
        .expect(201);
        
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: activeRefreshToken })
        .expect(401);
    });
  });

  describe('Whitelist Cleanup', () => {
    it('DELETE /auth/whitelist - removes email', async () => {
      await request(app.getHttpServer())
        .delete('/auth/whitelist')
        .set('Authorization', `Bearer ${adminJwt}`)
        .send({ email: TEST_EMAIL })
        .expect(200);
    });
  });
});
