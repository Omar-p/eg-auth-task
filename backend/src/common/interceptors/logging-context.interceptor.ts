import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '../services/logging.service';
import { AuthUser } from '../../iam/authentication/interfaces/auth-user.interface';

@Injectable()
export class LoggingContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const response = context.switchToHttp().getResponse<Response>();

    // Generate unique IDs for this request
    const traceId = uuidv4();

    // Extract user information if authenticated
    const user: AuthUser | undefined = request.user;
    const userId = user?.id || 'anonymous';

    // Set logging context for this request
    LoggingService.setContext({
      userId,
      traceId,
    });

    // Add traceId to response headers for client tracking
    response.setHeader('x-trace-id', traceId);

    return next.handle();
  }
}
