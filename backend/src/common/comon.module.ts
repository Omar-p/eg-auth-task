import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './services/logging.service';
import { AppLoggerService } from './services/app-logger.service';
import { MongoDBLoggerService } from './services/mongodb-logger.service';

@Module({
  providers: [
    LoggingService,
    AppLoggerService,
    MongoDBLoggerService,
  ],
  exports: [LoggingService, AppLoggerService, MongoDBLoggerService],
})
export class CommonModule {}

