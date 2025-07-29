# Development Guide

This guide provides detailed instructions for setting up and developing the Bank Server application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Development Workflow](#development-workflow)
- [Architecture Overview](#architecture-overview)
- [API Development](#api-development)
- [Testing](#testing)
- [Database Migrations](#database-migrations)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v12.18 or higher
- **yarn** v1.22 or higher
- **PostgreSQL** v10.12 or higher
- **Git** for version control

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd bank-server
yarn install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

```env
# Server Configuration
PORT=4000
TRANSPORT_PORT=5000

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_EXPIRATION_TIME=3600
JWT_FORGOTTEN_PASSWORD_TOKEN_SECRET=your-reset-secret-here
JWT_FORGOTTEN_PASSWORD_TOKEN_EXPIRATION_TIME=3600

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=bank

# Default Admin Users
BANK_ROOT_EMAIL=root@bank.com
BANK_ROOT_PASSWORD=secure-password
BANK_AUTHOR_EMAIL=author@bank.com
BANK_AUTHOR_PASSWORD=secure-password
BANK_AUTHOR_FIRSTNAME=Your
BANK_AUTHOR_LASTNAME=Name

# Email Configuration (for notifications)
EMAIL_HOST=gmail
EMAIL_PORT=587
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
```

## Database Setup

### 1. Create Database

Create a PostgreSQL database:

```bash
# Using psql
createdb bank

# Or using SQL
psql -c "CREATE DATABASE bank;"
```

### 2. Run Migrations

The application uses TypeORM for database management. Migrations will run automatically when you start the application (`migrationsRun: true` in configuration).

To manually run migrations:

```bash
# Generate a new migration
yarn migration:generate MigrationName

# Run pending migrations
yarn migration:run

# Revert the last migration
yarn migration:revert

# Drop the entire schema (use with caution!)
yarn schema:drop
```

## Development Workflow

### Development Scripts

```bash
# Start development server with hot reload
yarn start:dev

# Start development server with debugging
yarn start:debug

# Build the application
yarn build

# Start production server
yarn start:prod

# Format code with Prettier
yarn format

# Lint code with ESLint
yarn lint

# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run end-to-end tests
yarn test:e2e
```

### Hot Reload Development

The development server supports hot reload. Start it with:

```bash
yarn start:dev
```

The server will automatically restart when you make changes to the source code.

### Debugging

To debug the application:

```bash
yarn start:debug
```

This starts the server with Node.js debugging enabled. You can attach a debugger on the default port (9229).

## Architecture Overview

### NestJS Module Structure

The application follows a modular architecture with the following core modules:

#### Core Modules

- **AppModule**: Main application module that imports all other modules
- **AuthModule**: Handles authentication, JWT tokens, and password management
- **UserModule**: User management, profiles, and configuration
- **BillModule**: Bank account management (called "bills" in the codebase)
- **TransactionModule**: Money transfers and transaction processing
- **CurrencyModule**: Multi-currency support and exchange rate management
- **MessageModule**: User messaging and notification templates
- **LanguageModule**: Internationalization support

#### Shared Components

- **Common**: Shared DTOs, entities, and base classes
- **Guards**: Authentication and authorization guards
- **Interceptors**: Request/response processing
- **Filters**: Exception handling
- **Middlewares**: Express middleware integration

### Key Architectural Patterns

#### Double-Entry Bookkeeping

The application implements double-entry bookkeeping principles:

- Each transaction affects two accounts (sender and recipient)
- Account balances are calculated dynamically from transaction history
- Ensures data integrity and accurate financial reporting

#### Domain-Driven Design

- Each module represents a business domain
- Clear separation of concerns
- Service-oriented architecture within modules

#### Event-Driven Architecture

- Uses TypeORM subscribers for automated actions
- Welcome bonuses triggered on account creation
- Automated messaging and notifications

## API Development

### Swagger Documentation

The application includes automatic API documentation using Swagger. Access it at:

```
http://localhost:4000/documentation
```

### Adding New Endpoints

1. **Create DTOs** in the appropriate module's `dtos/` directory
2. **Add controller methods** with proper decorators
3. **Implement business logic** in services
4. **Add Swagger documentation** using decorators

Example controller method:

```typescript
@Post()
@ApiOperation({ summary: 'Create a new resource' })
@ApiResponse({ status: 201, description: 'Resource created successfully' })
@ApiResponse({ status: 400, description: 'Bad request' })
async create(@Body() createDto: CreateResourceDto): Promise<ResourceEntity> {
  return this.resourceService.create(createDto);
}
```

### Authentication

The application uses JWT-based authentication:

- **Login**: POST `/bank/auth/login`
- **Register**: POST `/bank/auth/register`
- **Protected routes**: Include `Authorization: Bearer <token>` header

### API Versioning

All API endpoints are prefixed with `/bank`. This is configured in `main.ts`:

```typescript
app.setGlobalPrefix('bank');
```

## Testing

### Unit Tests

Unit tests are located alongside source files with `.spec.ts` extension:

```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage report
yarn test:cov
```

### End-to-End Tests

E2E tests are in the `test/` directory:

```bash
# Run E2E tests
yarn test:e2e
```

### Test Configuration

Jest configuration is in `package.json`:

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".spec.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

## Database Migrations

### Creating Migrations

When you modify entities, generate a migration:

```bash
yarn migration:generate MigrationName
```

This creates a new migration file in `src/migrations/`.

### Migration Best Practices

1. **Review generated migrations** before running them
2. **Test migrations** on a copy of production data
3. **Keep migrations small** and focused
4. **Add rollback logic** when possible
5. **Document complex migrations**

### Entity Development

When creating or modifying entities:

1. **Use TypeORM decorators** properly
2. **Follow naming conventions** (snake_case for database columns)
3. **Add proper relationships** between entities
4. **Include validation decorators** from class-validator

Example entity:

```typescript
@Entity('users')
export class UserEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @OneToMany(() => BillEntity, bill => bill.user)
  bills: BillEntity[];
}
```

## Performance Considerations

### Database Optimization

- Use proper indexes on frequently queried columns
- Implement pagination for large datasets
- Use database transactions for data consistency
- Monitor query performance with TypeORM logging

### Caching

Consider implementing caching for:

- Currency exchange rates
- User session data
- Frequently accessed configuration

### Security

- All endpoints use rate limiting (configured in `main.ts`)
- Passwords are hashed using bcrypt
- JWT tokens have configurable expiration
- Input validation using class-validator
- SQL injection protection via TypeORM

## Monitoring and Logging

### Request Logging

The application uses Morgan for HTTP request logging:

```typescript
app.use(morgan('combined'));
```

### Error Handling

Global exception filters handle errors consistently:

- `HttpExceptionFilter`: Handles HTTP exceptions
- `QueryFailedFilter`: Handles database query errors

### Health Checks

Consider implementing health check endpoints for:

- Database connectivity
- External API availability
- Application status

## Deployment Considerations

### Environment Variables

Ensure all required environment variables are set in production:

- Database credentials
- JWT secrets
- Email configuration
- External API keys

### Database

- Run migrations before deploying new versions
- Backup database before major updates
- Monitor database performance and connections

### Security

- Use HTTPS in production
- Set secure JWT secrets
- Configure proper CORS settings
- Enable security headers (Helmet is already configured)

## Next Steps

- Set up continuous integration
- Implement comprehensive logging
- Add monitoring and alerting
- Consider containerization with Docker
- Implement automated testing in CI/CD pipeline
