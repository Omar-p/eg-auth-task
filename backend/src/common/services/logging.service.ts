import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
  userId?: string;
  traceId?: string;
  mongodb?: {
    collection?: string;
    operation?: string;
    executionTimeMs?: number;
    documentsAffected?: number;
    filter?: Record<string, any>;
  };
}

@Injectable()
export class LoggingService {
  private static asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  static setContext(context: Partial<LogContext>): void {
    const existing = this.asyncLocalStorage.getStore() || {};
    this.asyncLocalStorage.enterWith({ ...existing, ...context });
  }

  static getContext(): LogContext {
    return this.asyncLocalStorage.getStore() || {};
  }

  static getUserId(): string | undefined {
    return this.getContext().userId;
  }

  static getTraceId(): string | undefined {
    return this.getContext().traceId;
  }

  static clear(): void {
    this.asyncLocalStorage.enterWith({});
  }
}
