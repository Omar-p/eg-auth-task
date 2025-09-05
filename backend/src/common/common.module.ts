import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { LoggingService } from './services/logging.service';
import { AppLoggerService } from './services/app-logger.service';
import { MongoDBLoggerService } from './services/mongodb-logger.service';
import { RequestCorrelationMiddleware } from './middleware/request-correlation.middleware';
import { UserContextMiddleware } from './middleware/user-context.middleware';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment =
          configService.get<string>('NODE_ENV') === 'development';

        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info',
            // Only use pretty transport in development
            ...(isDevelopment && {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                },
              },
            }),
            base: {
              pid: process.pid,
              service: 'easygenerator-auth-backend',
              environment: configService.get<string>('NODE_ENV'),
            },
            customProps: () => {
              const context = LoggingService.getContext();
              return {
                userId: context.userId,
                traceId: context.traceId,
              };
            },
            serializers: {
              req: (req: { method?: string; url?: string }) => ({
                method: req.method,
                url: req.url,
              }),
              res: (res: { statusCode?: number }) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
  ],
  providers: [
    LoggingService,
    AppLoggerService,
    MongoDBLoggerService,
    RequestCorrelationMiddleware,
    UserContextMiddleware,
  ],
  exports: [
    LoggingService,
    AppLoggerService,
    MongoDBLoggerService,
    RequestCorrelationMiddleware,
    UserContextMiddleware,
  ],
})
export class CommonModule {}
