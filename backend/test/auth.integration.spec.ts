import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { AppModule } from '../src/app.module';
import { User } from '../src/iam/entities/user.entity';
import { RefreshToken } from '../src/iam/entities/refresh-token.entity';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let mongoContainer: MongoDBContainer;
  let userModel: Model<User>;
  let refreshTokenModel: Model<RefreshToken>;
  let mongoUri: string;
  let testPort: number;

  // Helper function to get available port
  const getAvailablePort = (): Promise<number> => {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      server.listen(0, () => {
        const port = server.address()?.port;
        server.close(() => resolve(port));
      });
    });
  };

  // Helper function to extract cookies safely
  const extractRefreshTokenCookie = (response: request.Response): string => {
    const setCookieHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader].filter(Boolean);
    return cookies.find((cookie) => cookie?.startsWith('refresh_token=')) || '';
  };

  beforeAll(async () => {
    console.log('🚀 Starting integration test setup...');

    try {
      // Get random available port for the test app
      testPort = await getAvailablePort();
      console.log(`🔌 Test app will use port: ${testPort}`);

      // Start MongoDB testcontainer with random port
      console.log('🐳 Starting MongoDB testcontainer...');
      mongoContainer = new MongoDBContainer('mongo:8.0.13')
        .withExposedPorts(27017)
        .withStartupTimeout(120000);

      const startedContainer = await mongoContainer.start();
      mongoUri = startedContainer.getConnectionString();
      console.log(`🔗 MongoDB container URI: ${mongoUri}`);

      // Test MongoDB connection with proper options
      console.log('🏥 Testing MongoDB connection...');
      const mongoose = require('mongoose');
      await mongoose.connect(mongoUri, {
        directConnection: true, // Skip replica set discovery
        serverSelectionTimeoutMS: 5000,
      });
      await mongoose.connection.close();
      console.log('✅ MongoDB connection successful!');
    } catch (error) {
      console.error('❌ Failed to start MongoDB container:', error);
      throw error;
    }

    // Set test environment variables
    process.env.MONGODB_USERNAME = '';
    process.env.MONGODB_PASSWORD = '';
    process.env.MONGODB_HOST = '';
    process.env.MONGODB_PORT = '';
    process.env.MONGODB_DATABASE = '';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
    process.env.JWT_TOKEN_AUDIENCE = 'test-audience';
    process.env.JWT_TOKEN_ISSUER = 'test-issuer';
    process.env.JWT_ACCESS_TOKEN_TTL = '3600';
    process.env.JWT_REFRESH_TOKEN_TTL = '604800';
    process.env.COOKIE_DOMAIN = '';
    process.env.COOKIE_SECURE = 'false';
    process.env.COOKIE_SAME_SITE = 'lax';

    try {
      console.log('🏗️ Creating NestJS test module...');

      // Create test module with testcontainer
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: (key: string, defaultValue?: any) => {
            const config = {
              'database.uri': mongoUri,
              'database.options': {
                directConnection: true,
                serverSelectionTimeoutMS: 5000,
                retryWrites: false, // Disable for standalone
              },
              NODE_ENV: 'test',
              JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
              JWT_TOKEN_AUDIENCE: 'test-audience',
              JWT_TOKEN_ISSUER: 'test-issuer',
              JWT_ACCESS_TOKEN_TTL: 3600,
              JWT_REFRESH_TOKEN_TTL: 604800,
              COOKIE_DOMAIN: '',
              COOKIE_SECURE: 'false',
              COOKIE_SAME_SITE: 'lax',
            };
            return config[key] || defaultValue;
          },
        })
        .compile();

      app = moduleFixture.createNestApplication();

      // Configure middleware and pipes
      app.use(cookieParser());
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      console.log('🔌 Initializing NestJS application...');
      await app.init();
      await app.listen(testPort);
      console.log(`✅ NestJS app listening on port ${testPort}`);

      // Get model references for test data setup
      userModel = app.get<Model<User>>(getModelToken(User.name));
      refreshTokenModel = app.get<Model<RefreshToken>>(
        getModelToken(RefreshToken.name),
      );
      console.log('🗄️ Database models initialized');
    } catch (error) {
      console.error('❌ Failed to initialize NestJS app:', error);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test resources...');

    try {
      if (app) {
        await app.close();
        console.log('✅ NestJS app closed');
      }

      // Container cleanup is handled automatically by testcontainers v11+
      console.log('✅ MongoDB container cleanup handled automatically');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }, 30000); // 30 second timeout for cleanup

  beforeEach(async () => {
    // Clean database before each test
    await userModel.deleteMany({});
    await refreshTokenModel.deleteMany({});
  });

  describe('POST /api/auth/sign-up', () => {
    it('should create a new user with valid data', async () => {
      const signUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpDto)
        .expect(201);

      // Sign-up only creates user, doesn't return tokens
      expect(response.body).toHaveProperty(
        'message',
        'User created successfully',
      );
      expect(response.body).toHaveProperty('userId');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');

      // No cookies should be set on sign-up
      expect(response.headers['set-cookie']).toBeUndefined();

      // Verify user was created in database
      const user = await userModel.findOne({ email: signUpDto.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(signUpDto.name);
      expect(user?.email).toBe(signUpDto.email);
    });

    it('should reject invalid email format', async () => {
      const signUpDto = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpDto)
        .expect(400);
    });

    it('should reject short name (less than 3 characters)', async () => {
      const signUpDto = {
        email: 'test@example.com',
        name: 'Jo',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpDto)
        .expect(400);
    });

    it('should reject weak password', async () => {
      const signUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: '12345678', // No special characters or letters
      };

      await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpDto)
        .expect(400);
    });
  });

  describe('POST /api/auth/sign-in', () => {
    beforeEach(async () => {
      // Create a test user first
      await request(app.getHttpServer()).post('/api/auth/sign-up').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      });
    });

    it('should authenticate user with valid credentials', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send(signInDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');

      // Check refresh token cookie
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('refresh_token=')]),
      );
    });

    it('should reject invalid credentials', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send(signInDto)
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Create user first
      await request(app.getHttpServer()).post('/api/auth/sign-up').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      });

      // Sign in to get refresh token
      const signInResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Extract refresh token cookie
      refreshTokenCookie = extractRefreshTokenCookie(signInResponse);
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');

      // Should get new refresh token
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('refresh_token=')]),
      );
    });

    it('should reject request without refresh token cookie', async () => {
      await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    });

    it('should reject request with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', 'refresh_token=invalid_token_here')
        .expect(401);
    });

    it('should revoke refresh token after use (token rotation)', async () => {
      // First refresh should work
      const firstRefreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      expect(firstRefreshResponse.body).toHaveProperty('accessToken');
      expect(firstRefreshResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('refresh_token=')]),
      );

      // Extract new refresh token
      const newRefreshTokenCookie =
        extractRefreshTokenCookie(firstRefreshResponse);
      expect(newRefreshTokenCookie).toBeTruthy();
      expect(newRefreshTokenCookie).not.toBe(refreshTokenCookie);

      // Old refresh token should now be invalid
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(401);

      // New refresh token should work
      const secondRefreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', newRefreshTokenCookie)
        .expect(200);

      expect(secondRefreshResponse.body).toHaveProperty('accessToken');
    });

    it('should mark old refresh token as revoked in database', async () => {
      // Get initial refresh token count
      const initialTokenCount = await refreshTokenModel.countDocuments();

      // Use refresh token
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      // Should have created a new token
      const finalTokenCount = await refreshTokenModel.countDocuments();
      expect(finalTokenCount).toBe(initialTokenCount + 1);

      // Old token should be marked as revoked
      const revokedTokens = await refreshTokenModel.find({ isRevoked: true });
      expect(revokedTokens).toHaveLength(1);
      expect(revokedTokens[0].revokedAt).toBeTruthy();

      // New token should not be revoked
      const activeTokens = await refreshTokenModel.find({ isRevoked: false });
      expect(activeTokens).toHaveLength(1);
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Create user first
      await request(app.getHttpServer()).post('/api/auth/sign-up').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      });

      // Sign in to get refresh token
      const signInResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      refreshTokenCookie = extractRefreshTokenCookie(signInResponse);
    });

    it('should logout user and clear refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', refreshTokenCookie)
        .expect(200);

      // Check that refresh token cookie is cleared
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('refresh_token=; Path=/api/auth'),
        ]),
      );
    });

    it('should reject logout without refresh token', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });

  describe('DELETE /api/auth/sessions', () => {
    let accessToken: string;
    let refreshTokenCookies: string[] = [];

    beforeEach(async () => {
      // Create user first
      await request(app.getHttpServer()).post('/api/auth/sign-up').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      });

      // Create multiple sessions by signing in multiple times
      const sessions: request.Response[] = [];
      for (let i = 0; i < 3; i++) {
        const signInResponse = await request(app.getHttpServer())
          .post('/api/auth/sign-in')
          .send({
            email: 'test@example.com',
            password: 'Password123!',
          });

        sessions.push(signInResponse);
        refreshTokenCookies.push(extractRefreshTokenCookie(signInResponse));
      }

      // Use the access token from the last session
      accessToken = sessions[sessions.length - 1].body.accessToken;
    });

    afterEach(async () => {
      refreshTokenCookies = [];
    });

    it('should delete all user sessions and revoke all refresh tokens', async () => {
      // Verify we have 3 active refresh tokens before logout-all
      const activeTokensBefore = await refreshTokenModel.find({
        isRevoked: false,
      });
      expect(activeTokensBefore).toHaveLength(3);

      // Call sessions delete endpoint
      const response = await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Check response format
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/deleted \d+ session/i);

      // Verify all refresh tokens are now revoked
      const activeTokensAfter = await refreshTokenModel.find({
        isRevoked: false,
      });
      expect(activeTokensAfter).toHaveLength(0);

      const revokedTokensAfter = await refreshTokenModel.find({
        isRevoked: true,
      });
      expect(revokedTokensAfter).toHaveLength(3);

      // All revoked tokens should have revokedAt timestamp
      revokedTokensAfter.forEach((token) => {
        expect(token.revokedAt).toBeTruthy();
        expect(token.revokedAt).toBeInstanceOf(Date);
      });
    });

    it('should prevent refresh token usage after sessions delete', async () => {
      // Call sessions delete
      await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use any of the previous refresh tokens - all should fail
      for (const refreshTokenCookie of refreshTokenCookies) {
        await request(app.getHttpServer())
          .post('/api/auth/refresh')
          .set('Cookie', refreshTokenCookie)
          .expect(401);
      }
    });

    it('should reject sessions delete without valid access token', async () => {
      await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .expect(401);
    });

    it('should reject sessions delete with invalid access token', async () => {
      await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });

    it('should work correctly when user has no active sessions', async () => {
      // First delete all sessions
      await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Create a new session to test sessions delete on user with no existing sessions
      const newSignInResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const newAccessToken = newSignInResponse.body.accessToken;

      // Call sessions delete again - should work and report 1 session
      const response = await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(response.body.message).toMatch(/deleted 1 session/i);
    });

    it('should only delete sessions for the authenticated user, not other users', async () => {
      // Create second user
      await request(app.getHttpServer()).post('/api/auth/sign-up').send({
        email: 'test2@example.com',
        name: 'Test User 2',
        password: 'Password123!',
      });

      // Sign in second user
      const user2SignInResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send({
          email: 'test2@example.com',
          password: 'Password123!',
        });

      const user2AccessToken = user2SignInResponse.body.accessToken;

      // Verify we have tokens for both users
      const allTokensBefore = await refreshTokenModel.find({
        isRevoked: false,
      });
      expect(allTokensBefore.length).toBeGreaterThan(1); // At least 1 for each user

      // User 1 calls sessions delete
      await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // User 2 should still be able to use their refresh token
      const user2RefreshCookie = extractRefreshTokenCookie(user2SignInResponse);
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', user2RefreshCookie)
        .expect(200);

      // User 2 should still be able to call sessions delete
      await request(app.getHttpServer())
        .delete('/api/auth/sessions')
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(200);
    });
  });

  describe('Exception Handling', () => {
    it('should return 400 for validation errors with proper error format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send({
          email: 'invalid-email',
          name: '',
          password: '123',
        })
        .expect(400);

      // Check exception handler format
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(Array.isArray(response.body.message)).toBeTruthy();
    });

    it('should return 401 for authentication errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 409 for duplicate email registration', async () => {
      const signUpDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123!',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpDto)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up')
        .send(signUpDto)
        .expect(409);

      expect(response.body).toHaveProperty('statusCode', 409);
    });
  });
});
