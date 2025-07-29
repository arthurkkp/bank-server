# Environment Setup Guide - Bank Server

This comprehensive guide covers setting up development, staging, and production environments for the Bank Server backend application with a focus on banking security and compliance requirements.

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Development Environment](#development-environment)
- [Staging Environment](#staging-environment)
- [Production Environment](#production-environment)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Security Configuration](#security-configuration)
- [Banking Compliance](#banking-compliance)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## 🌍 Overview

### Environment Strategy

The Bank Server application follows a three-tier environment strategy:

- **Development** - Local development and feature testing
- **Staging** - Pre-production testing and integration validation
- **Production** - Live banking application serving customers

### Security Principles

All environments must adhere to banking security standards:
- **Encryption in transit and at rest**
- **Secure authentication and authorization**
- **Comprehensive audit logging**
- **Regular security updates**
- **Compliance with banking regulations**

## 💻 System Requirements

### Hardware Requirements

#### Development Environment
- **CPU**: 4+ cores (Intel i5/AMD Ryzen 5 or better)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB available space (SSD recommended)
- **Network**: Stable internet connection

#### Staging/Production Environment
- **CPU**: 8+ cores (Intel Xeon/AMD EPYC)
- **RAM**: 32GB minimum, 64GB recommended
- **Storage**: 500GB+ SSD with backup
- **Network**: High-speed, redundant connections

### Software Requirements

#### Operating System
- **Linux**: Ubuntu 20.04+ LTS, CentOS 8+, RHEL 8+
- **macOS**: 10.15+ (development only)
- **Windows**: 10+ with WSL2 (development only)

#### Runtime Dependencies
- **Node.js**: v16.14+ LTS
- **Yarn**: v1.22+
- **PostgreSQL**: v12+
- **Redis**: v6+ (optional, for caching)
- **Git**: v2.25+
- **Docker**: v20.10+ (optional)

#### Development Tools
- **Code Editor**: VS Code, WebStorm, or similar
- **Database Client**: pgAdmin, DBeaver, or similar
- **API Testing**: Postman, Insomnia, or similar
- **Terminal**: Modern terminal with UTF-8 support

## 🛠 Development Environment

### Initial Setup

#### 1. Install Node.js and Yarn
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16.14.0
nvm use 16.14.0
nvm alias default 16.14.0

# Install Yarn
npm install -g yarn

# Verify installations
node --version  # Should show v16.14.0+
yarn --version  # Should show 1.22.0+
```

#### 2. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download and install from https://www.postgresql.org/download/windows/
```

#### 3. Setup Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE bank_dev;
CREATE USER bank_user WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE bank_dev TO bank_user;
ALTER USER bank_user CREATEDB;
\q
```

#### 4. Clone and Setup Repository
```bash
# Clone repository
git clone https://github.com/akkp-windsurf/bank-server.git
cd bank-server

# Install dependencies
yarn install

# Verify installation
yarn --check-files
```

#### 5. Environment Configuration
```bash
# Create development environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### 6. Development Environment Variables
```bash
# .env
NODE_ENV=development
PORT=4000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=bank_user
DATABASE_PASSWORD=dev_password
DATABASE_NAME=bank_dev

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-development-key-here
JWT_EXPIRATION_TIME=15m
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key
JWT_REFRESH_EXPIRATION_TIME=7d

# Email Configuration (for development)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASSWORD=your-mailtrap-password

# Application Configuration
API_PREFIX=bank
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# External APIs
CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest
CURRENCY_API_KEY=your-api-key

# Development Tools
ENABLE_SWAGGER=true
ENABLE_CORS=true
LOG_LEVEL=debug
```

#### 7. Database Migration and Seeding
```bash
# Run database migrations
yarn migration:run

# Seed initial data (optional)
yarn seed:run

# Verify database setup
yarn migration:show
```

#### 8. Start Development Server
```bash
# Start development server
yarn start:dev

# The API will be available at:
# http://localhost:4000/bank

# Swagger documentation:
# http://localhost:4000/bank/api-docs
```

### Development Tools Configuration

#### VS Code Setup
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "typescript"
  ],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

#### ESLint Configuration
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@nestjs/eslint-config-nestjs',
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

### Development Workflow

#### Daily Development Process
```bash
# Start of day
git checkout develop
git pull origin develop
yarn install  # Update dependencies if needed

# Start development server
yarn start:dev

# Run tests in watch mode (separate terminal)
yarn test:watch

# Run linting (separate terminal)
yarn lint:watch
```

#### Pre-commit Checks
```bash
# Run all quality checks
yarn test
yarn test:e2e
yarn lint
yarn build
```

## 🎭 Staging Environment

### Infrastructure Setup

#### Server Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install yarn

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx

# Install Redis (optional)
sudo apt install redis-server
```

#### Database Setup
```bash
# Create staging database
sudo -u postgres createdb bank_staging
sudo -u postgres createuser bank_staging_user

# Set password and permissions
sudo -u postgres psql
ALTER USER bank_staging_user WITH ENCRYPTED PASSWORD 'staging_password';
GRANT ALL PRIVILEGES ON DATABASE bank_staging TO bank_staging_user;
\q
```

#### Application Deployment
```bash
# Clone repository
git clone https://github.com/akkp-windsurf/bank-server.git
cd bank-server

# Checkout staging branch
git checkout staging

# Install dependencies
yarn install --frozen-lockfile

# Build application
yarn build

# Run migrations
yarn migration:run

# Configure PM2
pm2 start ecosystem.config.js --env staging
pm2 save
pm2 startup
```

#### Staging Environment Variables
```bash
# .env.staging
NODE_ENV=staging
PORT=4000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=bank_staging_user
DATABASE_PASSWORD=staging_password
DATABASE_NAME=bank_staging

# JWT Configuration
JWT_SECRET_KEY=your-staging-secret-key-here
JWT_EXPIRATION_TIME=15m
JWT_REFRESH_SECRET_KEY=your-staging-refresh-secret-key
JWT_REFRESH_EXPIRATION_TIME=7d

# Email Configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key

# Application Configuration
API_PREFIX=bank
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# External APIs
CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest
CURRENCY_API_KEY=your-api-key

# Staging Specific
ENABLE_SWAGGER=true
ENABLE_CORS=true
LOG_LEVEL=info
```

## 🚀 Production Environment

### Infrastructure Requirements

#### High Availability Setup
- **Load Balancer**: Multiple backend instances behind load balancer
- **Database**: PostgreSQL with master-slave replication
- **Caching**: Redis cluster for session management
- **SSL/TLS**: Valid certificates with proper cipher suites
- **Monitoring**: Comprehensive monitoring and alerting
- **Backup**: Regular backups and disaster recovery plan

#### Production Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=4000

# Database Configuration
DATABASE_HOST=prod-db-cluster.internal
DATABASE_PORT=5432
DATABASE_USERNAME=bank_prod_user
DATABASE_PASSWORD=super-secure-production-password
DATABASE_NAME=bank_production

# JWT Configuration
JWT_SECRET_KEY=extremely-long-and-secure-production-secret-key
JWT_EXPIRATION_TIME=15m
JWT_REFRESH_SECRET_KEY=extremely-long-refresh-secret-key
JWT_REFRESH_EXPIRATION_TIME=7d

# Email Configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=production-sendgrid-api-key

# Application Configuration
API_PREFIX=bank
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=50

# External APIs
CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest
CURRENCY_API_KEY=production-api-key

# Production Specific
ENABLE_SWAGGER=false
ENABLE_CORS=false
LOG_LEVEL=warn

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

#### Docker Production Setup
```dockerfile
FROM node:16-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false

COPY . .

RUN yarn build

FROM node:16-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

CHOWN nestjs:nodejs /app
USER nestjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

EXPOSE 4000

CMD ["node", "dist/main"]
```

## 🗄 Database Configuration

### PostgreSQL Optimization

#### Development Configuration
```sql
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Production Configuration
```sql
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 32MB
max_connections = 200
```

### Database Security

#### Connection Security
```sql
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
hostssl bank_production bank_prod_user  10.0.0.0/8             md5
```

#### Database Encryption
```sql
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'ca.crt'
ssl_crl_file = 'server.crl'
```

## 🔧 Environment Variables

### Complete Environment Variables Reference

#### Required Variables
```bash
# Application
NODE_ENV=development|staging|production
PORT=4000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=bank_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=bank_db

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRATION_TIME=15m
JWT_REFRESH_SECRET_KEY=your-refresh-secret
JWT_REFRESH_EXPIRATION_TIME=7d

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password
```

#### Optional Variables
```bash
# Application Configuration
API_PREFIX=bank
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# External APIs
CURRENCY_API_URL=https://api.exchangerate-api.com/v4/latest
CURRENCY_API_KEY=your-api-key

# Development Tools
ENABLE_SWAGGER=true|false
ENABLE_CORS=true|false
LOG_LEVEL=debug|info|warn|error

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEW_RELIC_LICENSE_KEY=your-key
```

### Environment Variable Validation

```typescript
import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number;

  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  JWT_SECRET_KEY: string;

  @IsString()
  JWT_EXPIRATION_TIME: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

## 🔒 Security Configuration

### SSL/TLS Configuration

#### Development (Self-signed certificates)
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

#### Production (Let's Encrypt)
```bash
sudo apt install certbot

sudo certbot certonly --standalone -d api.bankapp.com

sudo crontab -e
```

### Security Headers

```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  await app.listen(4000);
}
```

## 🏦 Banking Compliance

### PCI DSS Compliance

#### Data Protection
```typescript
import * as crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;

  encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string, key: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(this.algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### GDPR Compliance

#### Data Protection Configuration
```typescript
export const gdprConfig = {
  dataRetention: {
    userSessions: '30 days',
    transactionLogs: '7 years',
    auditLogs: '10 years',
    personalData: '6 years',
  },
  userRights: {
    dataAccess: true,
    dataPortability: true,
    dataErasure: true,
    dataRectification: true,
    dataProcessingRestriction: true,
  },
  consentManagement: {
    explicitConsent: true,
    consentWithdrawal: true,
    consentLogging: true,
  },
};
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Error Tracking with Sentry
```typescript
import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';

export const initializeMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        new Integrations.Http({ tracing: true }),
        new Integrations.Express({ app }),
      ],
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      beforeSend(event) {
        if (event.request?.data) {
          delete event.request.data.password;
          delete event.request.data.token;
          delete event.request.data.accountNumber;
        }
        return event;
      },
    });
  }
};
```

#### Performance Monitoring
```typescript
export const performanceMonitoring = {
  measureDatabaseQuery: (query: string, startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 1000) {
      console.warn(`Slow database query detected: ${query} took ${duration}ms`);
    }
    
    return duration;
  },
  
  measureApiResponse: (endpoint: string, startTime: number) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 2000) {
      console.warn(`Slow API response detected: ${endpoint} took ${duration}ms`);
    }
    
    return duration;
  },
};
```

### Logging Configuration

```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
      });
    })
  ),
  defaultMeta: {
    service: 'bank-server',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

export default logger;
```

### Audit Logging

```typescript
@Injectable()
export class AuditLogger {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        userId,
        action,
        resourceType,
        resourceId,
        metadata: this.sanitizeMetadata(metadata),
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      await this.sendToExternalAuditService({
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
    }
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    const sensitiveFields = [
      'password',
      'token',
      'authKey',
      'accountNumber',
      'ssn',
      'creditCardNumber',
    ];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private async sendToExternalAuditService(auditData: any): Promise<void> {
    // Implementation for external audit service
  }
}
```

## 🔧 Troubleshooting

### Common Environment Issues

#### Node.js Version Conflicts
```bash
# Check current version
node --version

# Install correct version
nvm install 16.14.0
nvm use 16.14.0
nvm alias default 16.14.0
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -p 5432 -U bank_user -d bank_db

# Check environment variables
echo $DATABASE_HOST
echo $DATABASE_PORT
echo $DATABASE_USERNAME
```

#### Build and Deployment Issues
```bash
# Clear cache and rebuild
yarn cache clean
rm -rf node_modules dist
yarn install
yarn build

# Check for TypeScript errors
yarn type-check

# Check for linting errors
yarn lint
```

### Environment-Specific Troubleshooting

#### Development Issues
- **Hot reload not working**: Check if port 4000 is available
- **Database migrations failing**: Verify database permissions
- **JWT token errors**: Check secret key configuration

#### Staging Issues
- **SSL certificate errors**: Verify certificate installation
- **502 Bad Gateway**: Check if application is running
- **Performance issues**: Check server resources and database connections

#### Production Issues
- **High memory usage**: Monitor and optimize queries
- **Slow API responses**: Check database query performance
- **Security warnings**: Review security headers and configurations

### Health Check Endpoints

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      database: await this.checkDatabase(),
      externalServices: await this.checkExternalServices(),
    };

    return checks;
  }

  @Get('detailed')
  async detailedCheck(): Promise<DetailedHealthCheck> {
    return {
      application: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      externalServices: await this.checkExternalServices(),
      security: await this.checkSecurityStatus(),
    };
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  private async checkExternalServices(): Promise<Record<string, ServiceHealth>> {
    const services = {
      currencyApi: await this.checkCurrencyApi(),
      emailService: await this.checkEmailService(),
    };

    return services;
  }

  private async checkSecurityStatus(): Promise<SecurityHealth> {
    return {
      jwtSecret: process.env.JWT_SECRET_KEY ? 'configured' : 'missing',
      httpsEnabled: process.env.NODE_ENV === 'production',
      rateLimitingEnabled: true,
      auditLoggingEnabled: true,
    };
  }
}
```

This comprehensive environment setup guide ensures that the Bank Server application can be deployed securely and reliably across all environments while maintaining banking industry standards for security and compliance.
