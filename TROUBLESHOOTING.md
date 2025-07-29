# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when developing with the Bank Server application.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Environment Configuration](#environment-configuration)
- [Development Server Issues](#development-server-issues)
- [Authentication Problems](#authentication-problems)
- [Migration Issues](#migration-issues)
- [Testing Issues](#testing-issues)
- [Performance Issues](#performance-issues)
- [API Issues](#api-issues)
- [Debugging Techniques](#debugging-techniques)

## Installation Issues

### Node.js Version Compatibility

**Problem**: Application fails to start with Node.js version errors.

**Solution**:
```bash
# Check your Node.js version
node --version

# Should be v12.18 or higher
# If not, install the correct version using nvm
nvm install 12.18
nvm use 12.18
```

### Yarn Installation Problems

**Problem**: `yarn install` fails with permission errors or package conflicts.

**Solutions**:
```bash
# Clear yarn cache
yarn cache clean

# Remove node_modules and yarn.lock, then reinstall
rm -rf node_modules yarn.lock
yarn install

# If permission issues on macOS/Linux
sudo chown -R $(whoami) ~/.yarn
```

### Native Dependencies Issues

**Problem**: Native dependencies fail to compile (bcrypt, etc.).

**Solutions**:
```bash
# Install build tools (Ubuntu/Debian)
sudo apt-get install build-essential python3

# Install build tools (macOS)
xcode-select --install

# Install build tools (Windows)
npm install --global windows-build-tools

# Rebuild native dependencies
yarn install --force
```

## Database Issues

### Connection Refused

**Problem**: `ECONNREFUSED` error when connecting to PostgreSQL.

**Diagnosis**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if PostgreSQL is listening on the correct port
sudo netstat -tlnp | grep 5432
```

**Solutions**:
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Check PostgreSQL configuration
sudo -u postgres psql -c "SHOW port;"
```

### Authentication Failed

**Problem**: `password authentication failed for user` error.

**Solutions**:
```bash
# Reset PostgreSQL user password
sudo -u postgres psql
ALTER USER your_username PASSWORD 'new_password';
\q

# Check pg_hba.conf authentication method
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Change 'peer' to 'md5' for local connections if needed

# Restart PostgreSQL after config changes
sudo systemctl restart postgresql
```

### Database Does Not Exist

**Problem**: `database "bank" does not exist` error.

**Solutions**:
```bash
# Create the database
sudo -u postgres createdb bank

# Or using psql
sudo -u postgres psql
CREATE DATABASE bank;
\q

# Grant permissions to your user
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE bank TO your_username;
\q
```

### Migration Errors

**Problem**: Migrations fail to run or create conflicts.

**Solutions**:
```bash
# Check migration status
yarn migration:show

# Revert the last migration
yarn migration:revert

# Drop schema and recreate (CAUTION: destroys data)
yarn schema:drop
yarn migration:run

# Generate a new migration after entity changes
yarn migration:generate FixMigrationName
```

## Environment Configuration

### Missing Environment Variables

**Problem**: Application crashes with "Cannot read property of undefined" for config values.

**Diagnosis**:
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.DB_HOST);"
```

**Solutions**:
```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env

# Verify all required variables are set
grep -v '^#' .env | grep -v '^$'
```

### Invalid Environment Values

**Problem**: Application starts but behaves unexpectedly due to wrong config values.

**Common Issues**:
- Wrong database port (should be number, not string)
- Invalid JWT secret (too short or contains special characters)
- Wrong email configuration

**Solutions**:
```bash
# Validate database connection
node -e "
const config = require('dotenv').config().parsed;
console.log('DB Config:', {
  host: config.DB_HOST,
  port: parseInt(config.DB_PORT),
  database: config.DB_DATABASE
});
"

# Test email configuration
# Check if EMAIL_HOST is valid (gmail, outlook, etc.)
# Verify EMAIL_PORT matches your provider
```

## Development Server Issues

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::4000`

**Solutions**:
```bash
# Find process using the port
lsof -i :4000
# or
netstat -tlnp | grep 4000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
echo "PORT=4001" >> .env
```

### Hot Reload Not Working

**Problem**: Changes to code don't trigger server restart.

**Solutions**:
```bash
# Ensure you're using the dev script
yarn start:dev

# Check if file watching is working
# On Linux, you might need to increase inotify limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Clear NestJS build cache
rm -rf dist/
yarn start:dev
```

### Memory Issues

**Problem**: Development server crashes with out-of-memory errors.

**Solutions**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
yarn start:dev

# Or add to package.json scripts
"start:dev": "NODE_OPTIONS='--max-old-space-size=4096' nest start --watch"
```

## Authentication Problems

### JWT Token Issues

**Problem**: Authentication fails with "Invalid token" or "Token expired".

**Diagnosis**:
```bash
# Check JWT configuration in .env
grep JWT .env

# Verify token format (should be: Bearer <token>)
# Check token expiration time
```

**Solutions**:
```bash
# Ensure JWT_SECRET_KEY is set and consistent
# Check JWT_EXPIRATION_TIME is reasonable (3600 = 1 hour)
# Verify client sends token in correct format:
# Authorization: Bearer <token>

# Debug token in development
node -e "
const jwt = require('jsonwebtoken');
const token = 'your-token-here';
const secret = 'your-secret-here';
try {
  console.log(jwt.verify(token, secret));
} catch (e) {
  console.error('Token error:', e.message);
}
"
```

### Password Hashing Issues

**Problem**: Login fails even with correct credentials.

**Solutions**:
```bash
# Check if bcrypt is working
node -e "
const bcrypt = require('bcrypt');
const password = 'test123';
const hash = bcrypt.hashSync(password, 10);
console.log('Hash:', hash);
console.log('Valid:', bcrypt.compareSync(password, hash));
"

# Verify password hashing in user creation
# Check if UtilsService.generateHash is being called
```

## Migration Issues

### Schema Sync Problems

**Problem**: Entity changes don't reflect in database.

**Solutions**:
```bash
# Generate migration for entity changes
yarn migration:generate UpdateEntityName

# Check generated migration file
ls -la src/migrations/

# Run the migration
yarn migration:run

# If synchronize is enabled (development only)
# Check ormconfig.ts: synchronize should be false in production
```

### Foreign Key Constraints

**Problem**: Migration fails due to foreign key constraint violations.

**Solutions**:
```bash
# Check existing data conflicts
# Manually fix data inconsistencies
# Or create a data migration to clean up

# Example: Remove orphaned records
sudo -u postgres psql bank
DELETE FROM child_table WHERE parent_id NOT IN (SELECT id FROM parent_table);
```

### Column Type Conflicts

**Problem**: Migration fails when changing column types.

**Solutions**:
```bash
# Create a custom migration for complex type changes
yarn migration:create CustomColumnChange

# Edit the migration file to handle data transformation
# Example: string to number conversion with data preservation
```

## Testing Issues

### Test Database Setup

**Problem**: Tests fail due to database connection issues.

**Solutions**:
```bash
# Create a separate test database
sudo -u postgres createdb bank_test

# Set TEST_DATABASE_URL environment variable
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/bank_test"

# Or configure test-specific environment
cp .env .env.test
# Edit .env.test with test database settings
```

### Mock Issues

**Problem**: Tests fail due to unmocked dependencies.

**Solutions**:
```typescript
// Ensure all external dependencies are mocked
jest.mock('external-library');

// Mock TypeORM repositories properly
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

// Use proper TypeORM testing utilities
import { getRepositoryToken } from '@nestjs/typeorm';
```

### Test Isolation

**Problem**: Tests affect each other or fail when run together.

**Solutions**:
```bash
# Run tests in isolation
yarn test --runInBand

# Clear database between tests
# Use transactions that rollback after each test
# Or use a fresh database for each test suite
```

## Performance Issues

### Slow Database Queries

**Problem**: API responses are slow due to database performance.

**Diagnosis**:
```bash
# Enable TypeORM query logging
# In ormconfig.ts: logging: true

# Check slow query log in PostgreSQL
sudo -u postgres psql bank
SHOW log_min_duration_statement;
SET log_min_duration_statement = 1000; -- Log queries > 1 second
```

**Solutions**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_sender_bill ON transactions(sender_bill_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Memory Leaks

**Problem**: Application memory usage grows over time.

**Diagnosis**:
```bash
# Monitor memory usage
node --inspect=0.0.0.0:9229 dist/main.js
# Use Chrome DevTools to profile memory

# Check for event listener leaks
# Monitor database connection pool
```

**Solutions**:
```typescript
// Properly close database connections
// Remove event listeners when done
// Use weak references where appropriate
// Implement proper cleanup in services
```

## API Issues

### CORS Problems

**Problem**: Frontend cannot access API due to CORS errors.

**Solutions**:
```typescript
// In main.ts, CORS is enabled globally
const app = await NestFactory.create(AppModule, { cors: true });

// For specific origins:
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
});
```

### Request Size Limits

**Problem**: Large requests fail with payload too large errors.

**Solutions**:
```typescript
// In main.ts, increase body parser limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### Rate Limiting Issues

**Problem**: Requests are blocked by rate limiter.

**Solutions**:
```typescript
// Adjust rate limiting in main.ts
app.use(RateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // Increase limit for development
}));

// Disable rate limiting in development
if (process.env.NODE_ENV !== 'production') {
  // Skip rate limiting
}
```

## Debugging Techniques

### Enable Debug Logging

```bash
# Start with debug mode
yarn start:debug

# Enable TypeORM logging
# In ormconfig.ts: logging: ['query', 'error', 'schema']

# Use debug module
DEBUG=* yarn start:dev
```

### Using Debugger

```bash
# Start with Node.js debugger
yarn start:debug

# Attach debugger (VS Code)
# Create .vscode/launch.json:
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229,
  "restart": true
}
```

### Common Error Messages

#### "Cannot resolve dependency"

**Problem**: NestJS dependency injection fails.

**Solutions**:
```typescript
// Ensure proper imports in module
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService],
  controllers: [UserController],
})

// Check circular dependencies
// Use forwardRef() if needed
@Inject(forwardRef(() => UserService))
```

#### "Entity metadata not found"

**Problem**: TypeORM cannot find entity definitions.

**Solutions**:
```typescript
// Ensure entity is imported in module
TypeOrmModule.forFeature([UserEntity])

// Check entity decorator
@Entity('users')
export class UserEntity {}

// Verify entity path in ormconfig
entities: ['src/modules/**/*.entity{.ts,.js}']
```

#### "Cannot read property of undefined"

**Problem**: Service or repository injection fails.

**Solutions**:
```typescript
// Check constructor injection
constructor(
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>,
) {}

// Ensure module imports
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
})
```

### Performance Debugging

#### Slow API Responses

**Diagnosis**:
```bash
# Enable request logging
# Check main.ts: app.use(morgan('combined'));

# Profile database queries
# Enable TypeORM logging: logging: ['query']

# Use Node.js profiler
node --prof dist/main.js
```

**Solutions**:
- Add database indexes
- Implement query optimization
- Use pagination for large datasets
- Cache frequently accessed data

#### Memory Usage Issues

**Diagnosis**:
```bash
# Monitor memory usage
node --inspect dist/main.js
# Open chrome://inspect in Chrome

# Check for memory leaks
# Use heap snapshots in Chrome DevTools
```

**Solutions**:
- Implement proper cleanup in services
- Remove event listeners when done
- Use weak references for caches
- Monitor database connection pools

### Development Environment Issues

#### TypeScript Compilation Errors

**Problem**: TypeScript fails to compile with type errors.

**Solutions**:
```bash
# Check TypeScript configuration
cat tsconfig.json

# Verify all dependencies are installed
yarn install

# Clear TypeScript cache
rm -rf dist/ node_modules/.cache/
yarn build
```

#### Hot Reload Issues

**Problem**: Changes don't trigger automatic restart.

**Solutions**:
```bash
# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart development server
yarn start:dev

# Check for syntax errors preventing compilation
yarn build
```

### Production Deployment Issues

#### Environment Variables

**Problem**: Application fails in production due to missing environment variables.

**Solutions**:
```bash
# Verify all required variables are set
env | grep -E "(DB_|JWT_|EMAIL_)"

# Check .env file is not committed to git
git status --ignored

# Use proper environment variable management
# Consider using Docker secrets or cloud provider secrets
```

#### Database Connection Pool

**Problem**: Database connection errors in production.

**Solutions**:
```typescript
// Configure connection pool in ormconfig
{
  type: 'postgres',
  // ... other config
  extra: {
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
    acquire: 30000, // Connection timeout
    idle: 10000,    // Idle timeout
  }
}
```

#### SSL/TLS Issues

**Problem**: Database connection fails with SSL errors.

**Solutions**:
```typescript
// Configure SSL in production
{
  type: 'postgres',
  // ... other config
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
}
```

This troubleshooting guide covers the most common issues developers encounter. For additional help, check the [DEVELOPMENT.md](./DEVELOPMENT.md) guide or reach out to the development team.
