// jwt-auth.guard.ts - Fixed version
import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../interfaces/auth-user.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

interface RequestWithAuth extends Request {
  headers: {
    authorization?: string;
  } & Request['headers'];
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.verbose(
        'JWT Auth Guard: Public endpoint, skipping authentication',
      );
      return true;
    }

    // Check if the endpoint has optional authentication
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOptionalAuth) {
      this.logger.verbose(
        'JWT Auth Guard: Optional auth endpoint, attempting authentication',
      );

      const request = context.switchToHttp().getRequest<RequestWithAuth>();
      const authHeader = request.headers.authorization;

      // If no auth header, allow request to proceed without user
      if (!authHeader) {
        this.logger.verbose(
          'JWT Auth Guard: No auth header, proceeding without user',
        );
        return true;
      }

      // If auth header present, validate it
      const result = super.canActivate(context);
      if (result instanceof Promise) {
        return result.catch(() => {
          this.logger.verbose(
            'JWT Auth Guard: Invalid auth header, proceeding without user',
          );
          return true;
        });
      }
      return result;
    }

    this.logger.verbose('JWT Auth Guard activated');

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeader = request.headers.authorization;

    this.logger.debug(
      `Authorization header: ${authHeader ? 'Present' : 'Missing'}`,
    );

    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(
    err: Error | null,
    user: AuthUser | null,
    info: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    status?: unknown,
  ): TUser {
    this.logger.verbose('JWT Auth Guard handling request');

    if (err) {
      this.logger.error(`JWT Guard error: ${err.message}`, err.stack);
      throw err;
    }

    if (!user) {
      this.logger.warn(
        `JWT Guard: No user found. Info: ${JSON.stringify(info)}`,
      );
      throw new UnauthorizedException('Invalid token');
    }

    this.logger.verbose(`JWT Guard: User authenticated: ${user.email}`);
    return user as TUser;
  }
}
