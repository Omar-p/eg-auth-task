import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../services/logging.service';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestCorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate a unique trace ID for this request
    const traceId = randomUUID();

    // Set the trace ID in the logging context
    LoggingService.setContext({ traceId });

    // Add trace ID to response headers for debugging
    res.setHeader('X-Trace-Id', traceId);

    next();
  }
}
