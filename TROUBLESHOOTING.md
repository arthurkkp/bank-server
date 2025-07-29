# Troubleshooting Guide - Bank Server

This guide provides solutions to common issues encountered during development, deployment, and operation of the Bank Server backend application.

## 📋 Table of Contents

- [Installation Issues](#installation-issues)
- [Database Problems](#database-problems)
- [Authentication Issues](#authentication-issues)
- [API and Network Problems](#api-and-network-problems)
- [Performance Issues](#performance-issues)
- [Banking-Specific Issues](#banking-specific-issues)
- [Production Deployment Issues](#production-deployment-issues)
- [Testing Problems](#testing-problems)
- [Security Issues](#security-issues)
- [Debugging Tools](#debugging-tools)

## 🔧 Installation Issues

### Node.js Version Conflicts

**Problem**: Application fails to start due to Node.js version incompatibility.

**Symptoms**:
```bash
Error: The engine "node" is incompatible with this module
```

**Solution**:
```bash
# Check current Node.js version
node --version

# Install correct version using nvm
nvm install 16.14.0
nvm use 16.14.0
nvm alias default 16.14.0

# Verify installation
node --version  # Should show v16.14.0+
```

### Yarn Installation Problems

**Problem**: Yarn package manager not found or outdated.

**Symptoms**:
```bash
yarn: command not found
```

**Solution**:
```bash
# Install Yarn globally
npm install -g yarn

# Verify installation
yarn --version  # Should show 1.22.0+

# If using newer versions of Node.js, enable Corepack
corepack enable
```

### Dependency Installation Failures

**Problem**: Dependencies fail to install due to network or permission issues.

**Symptoms**:
```bash
error An unexpected error occurred: "EACCES: permission denied"
```

**Solutions**:
```bash
# Clear yarn cache
yarn cache clean

# Remove node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# For permission issues on Linux/macOS
sudo chown -R $(whoami) ~/.yarn
sudo chown -R $(whoami) ~/.config/yarn

# Use different registry if network issues
yarn install --registry https://registry.npmjs.org/
```

## 🗄 Database Problems

### PostgreSQL Connection Issues

**Problem**: Cannot connect to PostgreSQL database.

**Symptoms**:
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:

1. **Check PostgreSQL Service**:
```bash
# Ubuntu/Debian
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services list | grep postgresql
brew services start postgresql

# Windows
# Check Services app for PostgreSQL service
```

2. **Verify Database Configuration**:
```bash
# Check if database exists
sudo -u postgres psql -l

# Create database if missing
sudo -u postgres createdb bank_db

# Check user permissions
sudo -u postgres psql -c "\du"
```

3. **Environment Variables**:
```bash
# Verify .env file
cat .env | grep DATABASE

# Example correct configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=bank_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=bank_db
```

### Migration Failures

**Problem**: Database migrations fail to run.

**Symptoms**:
```bash
QueryFailedError: relation "users" does not exist
```

**Solutions**:
```bash
# Check migration status
yarn migration:show

# Run pending migrations
yarn migration:run

# If migrations are corrupted, revert and re-run
yarn migration:revert
yarn migration:run

# Generate new migration if needed
yarn migration:generate -n FixDatabaseSchema
```

### Database Connection Pool Issues

**Problem**: Too many database connections or connection timeouts.

**Symptoms**:
```bash
Error: remaining connection slots are reserved
```

**Solutions**:
```typescript
// Update database configuration in app.module.ts
TypeOrmModule.forRoot({
  // ... other config
  extra: {
    max: 20,           // Maximum connections
    min: 5,            // Minimum connections
    acquire: 30000,    // Maximum time to get connection
    idle: 10000,       // Maximum idle time
  },
}),
```

## 🔐 Authentication Issues

### JWT Token Problems

**Problem**: JWT tokens are invalid or expired.

**Symptoms**:
```bash
Error: JsonWebTokenError: invalid token
Error: TokenExpiredError: jwt expired
```

**Solutions**:

1. **Check JWT Configuration**:
```bash
# Verify environment variables
echo $JWT_SECRET_KEY
echo $JWT_EXPIRATION_TIME

# Ensure secret is long and secure
JWT_SECRET_KEY=your-very-long-and-secure-secret-key-here
JWT_EXPIRATION_TIME=15m
```

2. **Debug Token Issues**:
```typescript
// Add debugging to JWT strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload): Promise<User> {
    console.log('JWT Payload:', payload);
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw new UnauthorizedException('Token expired');
    }
    
    return this.userService.findByUuid(payload.uuid);
  }
}
```

### Password Hashing Issues

**Problem**: Password comparison fails during login.

**Symptoms**:
```bash
Error: Invalid credentials
```

**Solutions**:
```typescript
// Verify bcrypt configuration
import * as bcrypt from 'bcrypt';

// Check salt rounds in environment
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Debug password hashing
async hashPassword(password: string): Promise<string> {
  console.log('Hashing password with salt rounds:', saltRounds);
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Generated hash length:', hash.length);
  return hash;
}

async comparePasswords(password: string, hash: string): Promise<boolean> {
  console.log('Comparing password with hash');
  const result = await bcrypt.compare(password, hash);
  console.log('Password comparison result:', result);
  return result;
}
```

## 🌐 API and Network Problems

### CORS Issues

**Problem**: Cross-origin requests are blocked.

**Symptoms**:
```bash
Access to fetch at 'http://localhost:4000/bank/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:
```typescript
// Update main.ts with proper CORS configuration
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://your-frontend-domain.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  await app.listen(4000);
}
```

### Rate Limiting Issues

**Problem**: Requests are being rate limited unexpectedly.

**Symptoms**:
```bash
Error: Too Many Requests
```

**Solutions**:
```typescript
// Check rate limiting configuration
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Time window in seconds
      limit: 100,   // Maximum requests per window
    }),
  ],
})

// Debug rate limiting
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(`Rate limit check for ${request.ip}: ${limit} requests per ${ttl}s`);
    
    return super.handleRequest(context, limit, ttl);
  }
}
```

### External API Integration Issues

**Problem**: Currency exchange API calls fail.

**Symptoms**:
```bash
Error: Request failed with status code 401
Error: ENOTFOUND api.exchangerate-api.com
```

**Solutions**:
```typescript
// Add retry logic and error handling
@Injectable()
export class CurrencyService {
  async getExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpService
          .get(`${this.apiUrl}/${baseCurrency}`, {
            timeout: 5000,
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          })
          .toPromise();

        return response.data;
      } catch (error) {
        lastError = error;
        console.log(`Currency API attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw new ServiceUnavailableException('Currency service unavailable');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## ⚡ Performance Issues

### Slow Database Queries

**Problem**: Database queries are taking too long to execute.

**Symptoms**:
```bash
Query execution time: 5000ms
```

**Solutions**:
```typescript
// Add database query logging
TypeOrmModule.forRoot({
  // ... other config
  logging: ['query', 'slow'],
  maxQueryExecutionTime: 1000,
}),

// Optimize queries with proper indexing
@Entity('transactions')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Transaction {
  // ... entity definition
}

// Use query builder for complex queries
const transactions = await this.transactionRepository
  .createQueryBuilder('transaction')
  .leftJoinAndSelect('transaction.user', 'user')
  .where('transaction.userId = :userId', { userId })
  .orderBy('transaction.createdAt', 'DESC')
  .limit(10)
  .getMany();
```

### Memory Leaks

**Problem**: Application memory usage keeps increasing.

**Symptoms**:
```bash
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
node --inspect=0.0.0.0:9229 dist/main.js

# Use clinic.js for profiling
npm install -g clinic
clinic doctor -- node dist/main.js
```

```typescript
// Proper cleanup in services
@Injectable()
export class SomeService implements OnModuleDestroy {
  private intervals: NodeJS.Timeout[] = [];

  onModuleDestroy() {
    this.intervals.forEach(interval => clearInterval(interval));
  }
}
```

## 🏦 Banking-Specific Issues

### Transaction Processing Failures

**Problem**: Transactions fail to process correctly.

**Symptoms**:
```bash
Error: Transaction failed: Insufficient funds
Error: Double-entry bookkeeping validation failed
```

**Solutions**:
```typescript
// Implement proper transaction handling
@Injectable()
export class TransactionService {
  async processTransaction(transactionData: CreateTransactionDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock accounts to prevent race conditions
      const senderAccount = await queryRunner.manager
        .createQueryBuilder(Account, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: transactionData.senderAccountId })
        .getOne();

      // Validate sufficient funds
      const senderBalance = new Decimal(senderAccount.balance);
      const transactionAmount = new Decimal(transactionData.amount);

      if (senderBalance.lt(transactionAmount)) {
        throw new BadRequestException('Insufficient funds');
      }

      // Process transaction
      // ... transaction logic

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Currency Conversion Precision Issues

**Problem**: Currency conversion calculations lose precision.

**Symptoms**:
```bash
Expected: 124.07, Received: 124.06999999999999
```

**Solutions**:
```typescript
// Use Decimal.js for all financial calculations
import { Decimal } from 'decimal.js';

@Injectable()
export class CurrencyService {
  convertCurrency(amount: string, exchangeRate: string): string {
    const amountDecimal = new Decimal(amount);
    const rateDecimal = new Decimal(exchangeRate);
    
    const result = amountDecimal.mul(rateDecimal);
    return result.toFixed(2);
  }

  // Validate decimal precision
  validateAmount(amount: string): boolean {
    try {
      const decimal = new Decimal(amount);
      return decimal.dp() <= 2 && decimal.gt(0);
    } catch {
      return false;
    }
  }
}
```

### Audit Logging Issues

**Problem**: Audit logs are missing or incomplete.

**Symptoms**:
```bash
Warning: No audit log found for transaction ID: txn_123
```

**Solutions**:
```typescript
// Implement comprehensive audit logging
@Injectable()
export class AuditService {
  async logTransaction(
    userId: string,
    action: string,
    transactionId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        userId,
        action,
        resourceId: transactionId,
        resourceType: 'TRANSACTION',
        metadata: this.sanitizeMetadata(metadata),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        timestamp: new Date(),
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      // Log to external service if database fails
      console.error('Audit logging failed:', error);
      await this.logToExternalService(userId, action, transactionId, metadata);
    }
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.accountNumber;
    
    return sanitized;
  }
}
```

## 🚀 Production Deployment Issues

### SSL/TLS Issues

**Problem**: HTTPS not working properly in production.

**Solutions**:
```typescript
// Configure HTTPS in main.ts
import { readFileSync } from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('./secrets/private-key.pem'),
    cert: readFileSync('./secrets/public-certificate.pem'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  await app.listen(4000);
}
```

### Docker Issues

**Problem**: Application fails to start in Docker container.

**Symptoms**:
```bash
Error: Cannot connect to database
Error: ENOENT: no such file or directory, open '.env'
```

**Solutions**:
```dockerfile
# Dockerfile optimization
FROM node:16-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start application
CMD ["node", "dist/main"]
```

## 🧪 Testing Problems

### Jest Configuration Issues

**Problem**: Tests fail to run or have import errors.

**Symptoms**:
```bash
Cannot find module '@nestjs/testing'
SyntaxError: Unexpected token 'export'
```

**Solutions**:
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
};
```

### Database Testing Issues

**Problem**: Tests interfere with each other or fail to clean up.

**Solutions**:
```typescript
// test/setup.ts
import { DataSource } from 'typeorm';

export const createTestDataSource = (): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: process.env.TEST_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.TEST_DATABASE_PORT) || 5433,
    username: process.env.TEST_DATABASE_USERNAME || 'test_user',
    password: process.env.TEST_DATABASE_PASSWORD || 'test_password',
    database: process.env.TEST_DATABASE_NAME || 'test_bank_db',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
    dropSchema: true,
  });
};

export const cleanDatabase = async (dataSource: DataSource): Promise<void> => {
  const entities = dataSource.entityMetadatas;
  
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
};
```

## 🔒 Security Issues

### Authentication Bypass

**Problem**: Users can access protected routes without authentication.

**Symptoms**:
```bash
Unauthorized access to /transactions endpoint
```

**Solutions**:
```typescript
// Verify guard is properly applied
@Controller('transactions')
@UseGuards(JwtAuthGuard) // Make sure this is present
export class TransactionController {
  // ... controller methods
}

// Check JWT strategy configuration
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
    });
  }
}

// Verify environment variables
console.log('JWT Secret:', process.env.JWT_SECRET_KEY ? 'SET' : 'NOT SET');
```

### SQL Injection Prevention

**Problem**: Potential SQL injection vulnerabilities.

**Solutions**:
```typescript
// ✅ Good: Use TypeORM query builder with parameters
const transactions = await this.transactionRepository
  .createQueryBuilder('transaction')
  .where('transaction.userId = :userId', { userId })
  .andWhere('transaction.amount > :minAmount', { minAmount: '0.00' })
  .getMany();

// ❌ Bad: Raw SQL with string concatenation
const query = `SELECT * FROM transactions WHERE user_id = '${userId}'`;
```

### XSS Protection

**Problem**: Cross-site scripting vulnerabilities in API responses.

**Solutions**:
```typescript
// Install and configure helmet
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
  }));
  
  await app.listen(4000);
}
```

## 🛠 Debugging Tools

### Application Logging

```typescript
// Enhanced logging configuration
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, trace }) => {
          return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
```

### Database Query Debugging

```typescript
// Enable query logging in TypeORM
TypeOrmModule.forRoot({
  // ... other config
  logging: ['query', 'error', 'slow'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000,
}),

// Custom query logger
export class CustomQueryLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    console.log('Query:', query);
    console.log('Parameters:', parameters);
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    console.error('Query Error:', error);
    console.error('Failed Query:', query);
    console.error('Parameters:', parameters);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    console.warn(`Slow Query (${time}ms):`, query);
  }
}
```

### Health Checks

```typescript
// Health check endpoint
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async check(): Promise<any> {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: await this.checkDatabase(),
      environment: process.env.NODE_ENV,
    };

    return checks;
  }

  private async checkDatabase(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - start;
      
      return { status: 'connected', latency };
    } catch (error) {
      return { status: 'disconnected' };
    }
  }
}
```

### Performance Monitoring

```typescript
// Performance monitoring interceptor
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(`${request.method} ${request.url} - ${duration}ms`);
        
        if (duration > 1000) {
          console.warn(`Slow request detected: ${request.method} ${request.url} - ${duration}ms`);
        }
      }),
    );
  }
}
```

## 📞 Getting Help

### Internal Resources

1. **Check Documentation First**:
   - [README.md](./README.md) - Setup and basic information
   - [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Development guidelines
   - [API Documentation](http://localhost:4000/bank/api-docs) - Swagger docs

2. **Common Commands**:
```bash
# Check application status
yarn start:dev
curl http://localhost:4000/health

# Database operations
yarn migration:show
yarn migration:run
yarn migration:revert

# Testing
yarn test
yarn test:cov
yarn test:e2e

# Code quality
yarn lint
yarn lint:fix
yarn format
```

3. **Log Locations**:
   - Application logs: `logs/combined.log`
   - Error logs: `logs/error.log`
   - Database logs: Console output when logging enabled

### External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Escalation Process

1. **Self-Service** (5-10 minutes)
   - Check this troubleshooting guide
   - Review error logs
   - Search documentation

2. **Team Help** (15-30 minutes)
   - Ask in team chat
   - Check with senior developers
   - Review similar issues in Git history

3. **Technical Lead** (30+ minutes)
   - Complex architectural issues
   - Security concerns
   - Performance problems

4. **External Support**
   - Database administration issues
   - Infrastructure problems
   - Third-party service integration

Remember: Banking applications require extra caution. When in doubt, always prioritize security and data integrity over speed of resolution.
