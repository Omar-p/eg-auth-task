# ADR-002: Authentication Architecture Decisions

## Status
Accepted

## Context
We need to implement a secure, scalable authentication system for the EasyGenerator interview task. The system requires JWT-based authentication with refresh token rotation, comprehensive logging for production observability, and reliable end-to-end testing.

## Decision

### 1. Token Management Architecture

#### 1.1 JWT + Refresh Token Strategy
**Decision**: Implement dual-token authentication with short-lived access tokens and long-lived refresh tokens.

**Rationale**:
- **Security**: Short access token lifetime (1 hour) limits exposure if compromised
- **User Experience**: Refresh tokens (7 days) prevent frequent re-authentication
- **Scalability**: Stateless access tokens reduce database lookups on every request

#### 1.2 Refresh Token Storage in MongoDB
**Decision**: Store refresh tokens in MongoDB with token rotation mechanism.

**Rationale**:
- **Immediate Revocation**: Enable instant session termination
- **Device Tracking**: Track refresh tokens per device for better security
- **Token Rotation**: Generate new refresh token on each use (prevents replay attacks)
- **Audit Trail**: Maintain token usage history for security monitoring

```typescript
// Refresh Token Schema
@Schema({ timestamps: true, collection: 'refresh_tokens' })
export class RefreshToken extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;
  
  @Prop({ required: true, index: true })
  tokenHash: string; // SHA-256 hash of actual token
  
  @Prop({ required: true })
  expiresAt: Date;
  
  @Prop({ default: false })
  isRevoked: boolean;
  
  @Prop()
  revokedAt?: Date;
  
  @Prop()
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
  };
}
```

#### 1.3 Token Rotation on Refresh
**Decision**: Implement automatic token rotation - revoke old refresh token and issue new one.

**Rationale**:
- **Security**: Prevents token replay attacks
- **Detection**: Identify suspicious activity if old token is reused
- **Best Practice**: Follows OAuth 2.1 security recommendations

```typescript
async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  // 1. Find and validate refresh token
  const storedToken = await this.refreshTokenModel.findOne({
    tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 2. Revoke used token (rotation)
  await this.refreshTokenModel.updateOne(
    { _id: storedToken._id },
    { isRevoked: true, revokedAt: new Date() }
  );

  // 3. Generate new tokens
  return await this.generateTokens(storedToken.userId, deviceInfo);
}
```

#### 1.4 HTTP-Only Cookie Implementation
**Decision**: Store refresh tokens in HTTP-only cookies with environment-aware configuration.

**Rationale**:
- **XSS Protection**: HTTP-only cookies prevent JavaScript access
- **CSRF Mitigation**: SameSite cookie attribute provides CSRF protection
- **Environment Flexibility**: Different settings for dev/staging/production

```typescript
// Environment-aware cookie configuration
private getCookieOptions(): CookieOptions {
  const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: refreshTokenTTL * 1000,
    path: '/api/auth',
    domain: isProduction ? '.omarshabaan.tech' : undefined,
  };
}
```

### 2. Logging Architecture

#### 2.1 Structured Logging with Pino
**Decision**: Use Pino logger with structured JSON output for CloudWatch Insights compatibility.

**Rationale**:
- **Performance**: Pino is one of the fastest Node.js loggers
- **CloudWatch Integration**: JSON structure enables efficient log queries
- **Production Ready**: Low overhead suitable for high-traffic applications
- **Correlation**: Request tracing with unique IDs

```typescript
// Logger configuration
LoggerModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    pinoHttp: {
      level: configService.get('NODE_ENV') === 'development' ? 'debug' : 'info',
      customProps: () => {
        const context = LoggingService.getContext();
        return {
          userId: context.userId,
          traceId: context.traceId,
        };
      },
    },
  }),
}),
```

#### 2.2 Request Correlation with Trace IDs
**Decision**: Implement request correlation using AsyncLocalStorage and UUID trace IDs.

**Rationale**:
- **Debugging**: Correlate all logs from a single request
- **Performance**: Minimal overhead using Node.js native AsyncLocalStorage
- **Observability**: Essential for distributed tracing in production

```typescript
@Injectable()
export class RequestCorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = randomUUID();
    LoggingService.setContext({ traceId });
    res.setHeader('X-Trace-Id', traceId);
    next();
  }
}
```

#### 2.3 MongoDB Operation Logging
**Decision**: Implement detailed MongoDB operation logging with execution metrics.

**Rationale**:
- **Performance Monitoring**: Track query execution times
- **Debugging**: Log queries with sanitized parameters
- **Compliance**: Audit trail for data access

```typescript
export class MongoDBLoggerService {
  logOperation(collection: string, operation: string, filter?: any) {
    return {
      start: () => this.logger.debug(`Starting ${operation} on ${collection}`),
      end: (result: any, documentsAffected: number) => {
        this.logger.info({
          collection,
          operation,
          executionTimeMs: Date.now() - startTime,
          documentsAffected,
          success: true
        });
      }
    };
  }
}
```

### 3. End-to-End Testing with Testcontainers

#### 3.1 Integration Testing Strategy
**Decision**: Use Testcontainers with real MongoDB instances for integration tests.

**Rationale**:
- **Real Database**: Test against actual MongoDB instead of mocks
- **Isolation**: Each test run gets fresh database instance
- **CI/CD Ready**: Works in containerized environments
- **Spring Boot Parity**: Same approach used in Java ecosystem

```typescript
describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let mongoContainer: MongoDBContainer;
  let mongoUri: string;

  beforeAll(async () => {
    // Start real MongoDB container
    mongoContainer = new MongoDBContainer('mongo:7.0.12')
      .withExposedPorts(27017)
      .withStartupTimeout(120000);
    
    const startedContainer = await mongoContainer.start();
    mongoUri = startedContainer.getConnectionString();

    // Configure app with test container
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string, defaultValue?: any) => ({
          'database.uri': mongoUri,
          // ... other test config
        }[key] || defaultValue),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
```

#### 3.2 Cookie and Authentication Flow Testing
**Decision**: Test complete authentication flows including cookie handling.

**Rationale**:
- **End-to-End Coverage**: Test entire user journey
- **Security Validation**: Verify cookie security attributes
- **API Contract**: Ensure frontend/backend integration works

```typescript
it('should complete full authentication flow', async () => {
  // 1. Sign up user
  const signUpResponse = await request(app.getHttpServer())
    .post('/api/auth/sign-up')
    .send({ email: 'test@example.com', name: 'Test User', password: 'Password123!' })
    .expect(201);

  // 2. Sign in and get tokens
  const signInResponse = await request(app.getHttpServer())
    .post('/api/auth/sign-in')
    .send({ email: 'test@example.com', password: 'Password123!' })
    .expect(200);

  // 3. Verify refresh token cookie
  const refreshTokenCookie = extractRefreshTokenCookie(signInResponse);
  expect(refreshTokenCookie).toBeDefined();

  // 4. Use refresh token
  await request(app.getHttpServer())
    .post('/api/auth/refresh')
    .set('Cookie', refreshTokenCookie)
    .expect(200);
});
```

## Consequences

### Positive
- **Security**: Multi-layered security with token rotation, HTTP-only cookies, and immediate revocation
- **Observability**: Comprehensive logging enables effective production monitoring
- **Testing Confidence**: Integration tests with real database ensure reliability
- **Scalability**: Stateless access tokens reduce database load
- **Maintainability**: Clear separation of concerns and well-documented decisions

### Negative
- **Complexity**: More complex than simple session-based authentication
- **Storage Overhead**: Refresh tokens require additional database storage
- **Test Overhead**: Testcontainers require Docker in CI/CD pipeline

### Risks and Mitigation
- **Risk**: Refresh token storage grows over time
  - **Mitigation**: Implement token cleanup job for expired tokens
- **Risk**: MongoDB dependency for token validation
  - **Mitigation**: Consider Redis for high-scale deployments
- **Risk**: Test container startup time
  - **Mitigation**: Parallel test execution and container reuse strategies

## Implementation Details

### Database Indexes
```typescript
// Optimize refresh token queries
@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;
  
  @Prop({ index: true }) // For token lookup
  tokenHash: string;
  
  @Prop({ index: true }) // For cleanup job
  expiresAt: Date;
}
```

### Environment Configuration
```yaml
# Production CloudFormation
Environment:
  - Name: JWT_ACCESS_TOKEN_TTL
    Value: "3600"  # 1 hour
  - Name: JWT_REFRESH_TOKEN_TTL
    Value: "604800"  # 7 days
  - Name: COOKIE_SECURE
    Value: "true"
  - Name: COOKIE_SAME_SITE
    Value: "lax"
  - Name: LOG_LEVEL
    Value: "info"
```

## Related ADRs
- ADR-001: Authentication State Management (Frontend)

## References
- [OAuth 2.1 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Testcontainers Documentation](https://testcontainers.com/)
- [Pino Logger Documentation](https://github.com/pinojs/pino)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
