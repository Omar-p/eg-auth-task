import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { MongoDBError } from '../interfaces/database-error.interface';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | object;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string | object;
    let mongoError: MongoDBError | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (this.isMongoError(exception)) {
      const result = this.handleMongoError(exception as MongoError);
      status = result.status;
      message = result.message;
      mongoError = result.mongoError;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    // Enhanced logging for MongoDB errors
    if (status === HttpStatus.INTERNAL_SERVER_ERROR || mongoError) {
      const logData = {
        method: request.method,
        url: request.url,
        statusCode: status,
        ...(mongoError && {
          mongodb: {
            error: mongoError,
            collection: mongoError.collection,
            operation: mongoError.operation,
            code: mongoError.code,
          },
        }),
      };

      this.logger.error(
        JSON.stringify(logData),
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.formatErrorMessage(message),
    };

    response.status(status).json(errorResponse);
  }

  private isMongoError(exception: unknown): exception is MongoError {
    return (
      exception instanceof MongoError ||
      (exception != null &&
        typeof exception === 'object' &&
        ('code' in exception || 'name' in exception) &&
        exception.constructor?.name.includes('Mongo'))
    );
  }

  private handleMongoError(error: MongoError): {
    status: HttpStatus;
    message: string;
    mongoError: MongoDBError;
  } {
    const mongoError: MongoDBError = {
      code: typeof error.code === 'number' ? error.code : 0,
      message: error.message,
      collection: (error as any).collection,
      operation: (error as any).operation,
      keyPattern: (error as any).keyPattern,
      keyValue: (error as any).keyValue,
      errorLabels: (error as any).errorLabels,
    };

    switch (error.code) {
      case 11000: // Duplicate key error
        return {
          status: HttpStatus.CONFLICT,
          message: 'Duplicate entry found',
          mongoError,
        };
      case 11001: // Duplicate key on update
        return {
          status: HttpStatus.CONFLICT,
          message: 'Duplicate entry on update',
          mongoError,
        };
      case 50: // Execution timeout
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Database operation timed out',
          mongoError,
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          mongoError,
        };
    }
  }

  private formatErrorMessage(message: string | object): string | object {
    if (typeof message === 'string') {
      return message;
    }

    if (message && typeof message === 'object' && 'message' in message) {
      return (message as { message: string }).message;
    }

    return message;
  }
}
