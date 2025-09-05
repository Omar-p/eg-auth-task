import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../services/logging.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string; // user ID from JWT
    email: string;
    name: string;
  };
}

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // If user is authenticated, add their ID to the logging context
    if (req.user?.sub) {
      const existingContext = LoggingService.getContext();
      LoggingService.setContext({
        ...existingContext,
        userId: req.user.sub,
      });
    }

    next();
  }
}
