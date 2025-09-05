import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

const logger = new Logger('RefreshTokenFromCookie');

export const RefreshTokenFromCookie = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const refreshToken = request.cookies?.refresh_token;

    logger.debug(
      `Checking for refresh token cookie. Available cookies: ${JSON.stringify(Object.keys(request.cookies || {}))}`,
    );
    logger.debug(`Refresh token found: ${!!refreshToken}`);

    if (!refreshToken) {
      logger.warn('Refresh token not found in cookies');
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    logger.debug('Refresh token extracted from cookie successfully');
    return refreshToken;
  },
);
