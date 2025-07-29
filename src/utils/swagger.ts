import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('Bank Server API')
    .setDescription('A comprehensive banking simulation API that provides realistic financial services including account management, money transfers, multi-currency support, and user communication. Built with NestJS and TypeScript.')
    .setVersion('2.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addTag('Auth', 'Authentication and user management endpoints')
    .addTag('Users', 'User profile and configuration management')
    .addTag('Bills', 'Bank account management and balance operations')
    .addTag('Transactions', 'Money transfer and transaction processing')
    .addTag('Currencies', 'Multi-currency support and exchange rates')
    .addTag('Messages', 'User communication and notification system')
    .addServer('http://localhost:4000', 'Development server')
    .addServer('https://api.pietrzakadrian.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('documentation', app, document);
}
