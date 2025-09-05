import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/services/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Pino logger for all NestJS logs
  app.useLogger(app.get(Logger));

  // Enable cookie parser middleware
  app.use(cookieParser());

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [];
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription('JWT-based authentication API with refresh tokens')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Serve OpenAPI spec as JSON and YAML
  app.getHttpAdapter().get('/api/docs-json', (req: any, res: any) => {
    res.json(document);
  });

  app.getHttpAdapter().get('/api/docs-yaml', (req: any, res: any) => {
    const yaml = require('js-yaml');
    res.type('text/yaml');
    res.send(yaml.dump(document));
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Use proper logging service with context
  const logger = app.get(AppLoggerService);
  logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
  logger.log(
    `📖 API Documentation: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
void bootstrap();
