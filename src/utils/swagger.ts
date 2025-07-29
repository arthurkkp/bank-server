import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('Banking API')
    .setDescription('Comprehensive banking application API with double-entry bookkeeping, multi-currency support, and secure transaction processing. This API provides endpoints for user authentication, account management, money transfers, and financial operations with enterprise-grade security.')
    .setVersion('2.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User profile management')
    .addTag('Bills', 'Account and bill management')
    .addTag('Transactions', 'Money transfer and transaction operations')
    .addTag('Currency', 'Currency and exchange rate operations')
    .addTag('Messages', 'User messaging and notifications')
    .addTag('Notifications', 'System notifications')
    .addServer('https://api.pietrzakadrian.com', 'Production server')
    .addServer('http://localhost:3000', 'Development server')
    .setContact('Adrian Pietrzak', 'https://bank.pietrzakadrian.com', 'contact@pietrzakadrian.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('documentation', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
    },
    customSiteTitle: 'Banking API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  });
}
