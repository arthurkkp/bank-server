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
  app.use(helmet());
  app.use('/bank/auth/login', 
    RateLimit({
      windowMs: 1 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later',
    })
  );

  app.use('/bank/auth/register', 
    RateLimit({
      windowMs: 15 * 60 * 1000,
      max: 3,
      message: 'Too many registration attempts, please try again later',
    })
  );

  app.use('/bank/auth/password/forget', 
    RateLimit({
      windowMs: 15 * 60 * 1000,
      max: 3,
      message: 'Too many password reset attempts, please try again later',
    })
  );

  app.use(RateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
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
  await app.listen(configService.get('PORT'));
}

void bootstrap();
