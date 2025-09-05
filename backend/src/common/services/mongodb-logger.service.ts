import { Injectable } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { LoggingService } from './logging.service';

@Injectable()
export class MongoDBLoggerService {
  constructor(private readonly logger: AppLoggerService) {}

  logOperation<T>(
    collection: string,
    operation: string,
    filter?: Record<string, any>,
  ): {
    start: () => void;
    end: (result?: T, documentsAffected?: number) => void;
    error: (error: Error) => void;
  } {
    const startTime = Date.now();
    const context = `MongoDB.${collection}.${operation}`;

    const sanitizedFilter = this.sanitizeFilter(filter);

    return {
      start: () => {
        LoggingService.setContext({
          mongodb: {
            collection,
            operation,
            filter: sanitizedFilter,
          },
        });
        this.logger.debug(`Starting ${operation} on ${collection}`, context);
      },

      end: (result?: T, documentsAffected?: number) => {
        const executionTimeMs = Date.now() - startTime;

        LoggingService.setContext({
          mongodb: {
            collection,
            operation,
            executionTimeMs,
            documentsAffected,
            filter: sanitizedFilter,
          },
        });

        this.logger.log(
          JSON.stringify({
            collection,
            operation,
            executionTimeMs,
            documentsAffected,
            filter: sanitizedFilter,
            success: true,
          }),
          context,
        );
      },

      error: (error: Error) => {
        const executionTimeMs = Date.now() - startTime;

        this.logger.error(
          JSON.stringify({
            collection,
            operation,
            executionTimeMs,
            filter: sanitizedFilter,
            error: {
              name: error.name,
              message: error.message,
              code: (error as any).code,
            },
            success: false,
          }),
          error.stack,
          context,
        );
      },
    };
  }

  private sanitizeFilter(filter?: Record<string, any>): Record<string, any> {
    if (!filter) return {};

    const sanitized = { ...filter };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}
