import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response, CookieOptions } from 'express';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  clearCookie?: boolean;
}

@Injectable()
export class AuthResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthResponseInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(
        (
          data: AuthResponse & { refreshToken?: string; clearCookie?: boolean },
        ) => {
          if (data?.refreshToken) {
            const cookieOptions = this.getCookieOptions();
            this.logger.debug(
              `Setting refresh token cookie with options: ${JSON.stringify(cookieOptions)}`,
            );

            response.cookie('refresh_token', data.refreshToken, cookieOptions);
            this.logger.debug('Refresh token cookie set successfully');
            const { refreshToken: _, ...responseWithoutRefreshToken } = data;
            return responseWithoutRefreshToken;
          }

          if (data?.clearCookie) {
            const cookieOptions = this.getCookieOptions();
            this.logger.debug(
              `Clearing refresh token cookie with options: ${JSON.stringify(cookieOptions)}`,
            );

            response.clearCookie('refresh_token', cookieOptions);
            this.logger.debug('Refresh token cookie cleared successfully');
            const { clearCookie: _, ...responseWithoutFlag } = data;
            return responseWithoutFlag;
          }

          return data;
        },
      ),
    );
  }

  private getCookieOptions(): CookieOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');
    const cookieSecure =
      this.configService.get<string>('COOKIE_SECURE', 'false') === 'true';
    const cookieSameSite = this.configService.get<'strict' | 'lax' | 'none'>(
      'COOKIE_SAME_SITE',
      'strict',
    );
    const refreshTokenTTL = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_TTL',
      604800,
    );

    const isProduction = nodeEnv === 'production';
    const isDocker =
      process.env.DOCKER_CONTAINER === 'true' ||
      process.env.HOSTNAME?.includes('docker');

    let domain: string | undefined;
    let secure: boolean;
    let sameSite: 'strict' | 'lax' | 'none';

    if (isProduction) {
      domain = cookieDomain || '.omarshabaan.tech';
      secure = cookieSecure;
      sameSite = cookieSameSite || 'lax';
    } else if (isDocker) {
      domain = cookieDomain;
      secure = cookieSecure;
      sameSite = cookieSameSite || 'lax';
    } else {
      domain = cookieDomain;
      secure = cookieSecure;
      sameSite = cookieSameSite || 'lax';
    }

    return {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: refreshTokenTTL * 1000,
      path: '/api/auth',
      domain: domain || undefined,
    };
  }
}
