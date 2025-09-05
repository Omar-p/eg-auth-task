import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface DeviceInfo {
  userAgent?: string;
  ip?: string;
}

export const DeviceInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DeviceInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return {
      userAgent: request.get('user-agent'),
      ip: request.ip || request.connection?.remoteAddress,
    };
  },
);
