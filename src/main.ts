import { Reflector, NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import { AppModule } from 'modules/app';
import * as helmet from 'helmet';
import { HttpExceptionFilter, QueryFailedFilter } from 'filters';
import * as RateLimit from 'express-rate-limit';
import * as morgan from 'morgan';
import { setupSwagger } from 'utils';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    { cors: true },
  );

  app.enable('trust proxy');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  app.use(RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
  }));
  app.use(compression());
  app.use(morgan('combined'));
  app.setGlobalPrefix('bank');

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalFilters(
    new HttpExceptionFilter(reflector),
    new QueryFailedFilter(reflector),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      dismissDefaultMessages: true,
      validationError: { target: false },
    }),
  );

  setupSwagger(app);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.warn(`🚀 Banking API server running on port ${port}`);
  console.warn(`📚 API Documentation available at http://localhost:${port}/documentation`);
  console.warn(`🔒 Security: CORS enabled, Rate limiting active (100 req/15min)`);
  console.warn(`📊 API Version: Banking API v2.0.0`);
}

void bootstrap();
