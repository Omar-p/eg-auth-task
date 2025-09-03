import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LoggingService } from './logging.service';

export interface IAppLogger {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
  setContext(context: string): void;
}

@Injectable()
export class AppLoggerService implements IAppLogger {
  constructor(private readonly pinoLogger: PinoLogger) {}

  private getLogContext(context?: string) {
    const requestContext = LoggingService.getContext();
    return {
      context,
      userId: requestContext.userId,
      traceId: requestContext.traceId,
    };
  }

  log(message: string, context?: string): void {
    this.pinoLogger.info(this.getLogContext(context), message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.pinoLogger.error({ ...this.getLogContext(context), trace }, message);
  }

  warn(message: string, context?: string): void {
    this.pinoLogger.warn(this.getLogContext(context), message);
  }

  debug(message: string, context?: string): void {
    this.pinoLogger.debug(this.getLogContext(context), message);
  }

  verbose(message: string, context?: string): void {
    this.pinoLogger.trace(this.getLogContext(context), message);
  }

  setContext(context: string): void {
    this.pinoLogger.setContext(context);
  }
}
