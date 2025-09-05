import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamModule } from './iam/iam.module';
import { CommonModule } from './common/common.module';
import { RequestCorrelationMiddleware } from './common/middleware/request-correlation.middleware';
import { UserContextMiddleware } from './common/middleware/user-context.middleware';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('database.uri'),
        ...configService.get<Record<string, any>>('database.options', {}),
      }),
    }),
    CommonModule,
    IamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestCorrelationMiddleware).forRoutes('*');
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
