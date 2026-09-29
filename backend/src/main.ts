import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Sets the standard security headers (X-Content-Type-Options,
  // X-Frame-Options, Strict-Transport-Security, a conservative CSP, etc.)
  // on every response. `crossOriginResourcePolicy` is relaxed to
  // "cross-origin" because Cloudinary-hosted images/videos are embedded on
  // the separate Next.js frontend origin and must not be blocked by it.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Every request now prints one line here (method, path, status, timing)
  // — previously only 500-level errors ever showed up after startup, so a
  // normal save from the admin dashboard was invisible in this terminal.
  app.use(requestLoggerMiddleware);

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared in the DTO
      transform: true, // turn query/body strings into their DTO types
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`EFC API listening on http://localhost:${port}/api`);
}

bootstrap();
