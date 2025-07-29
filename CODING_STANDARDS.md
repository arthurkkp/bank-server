# Coding Standards and Guidelines

This document outlines the coding standards, conventions, and best practices for the Bank Server project.

## Table of Contents

- [General Principles](#general-principles)
- [TypeScript Guidelines](#typescript-guidelines)
- [Code Formatting](#code-formatting)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [NestJS Specific Guidelines](#nestjs-specific-guidelines)
- [Database Guidelines](#database-guidelines)
- [Testing Standards](#testing-standards)
- [Documentation Standards](#documentation-standards)
- [Security Guidelines](#security-guidelines)

## General Principles

### SOLID Principles

Follow SOLID principles in all code:

- **Single Responsibility**: Each class should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Many client-specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

### DRY (Don't Repeat Yourself)

- Extract common functionality into shared utilities
- Use inheritance and composition appropriately
- Create reusable components and services

### KISS (Keep It Simple, Stupid)

- Write clear, readable code
- Avoid unnecessary complexity
- Prefer explicit over implicit behavior

## TypeScript Guidelines

### Type Safety

Always use TypeScript's type system effectively:

```typescript
// Good: Explicit types
interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
}

// Good: Return type annotations for public methods
async createUser(userData: CreateUserDto): Promise<UserEntity> {
  // implementation
}

// Avoid: Using 'any' type
// Bad
function processData(data: any): any {
  return data;
}
```

### Interface vs Type

- Use **interfaces** for object shapes that might be extended
- Use **type aliases** for unions, primitives, and computed types

```typescript
// Good: Interface for extensible object shapes
interface UserEntity {
  id: string;
  email: string;
}

// Good: Type for unions and computed types
type UserRole = 'USER' | 'ADMIN' | 'ROOT';
type UserWithRole = UserEntity & { role: UserRole };
```

### Generics

Use generics for reusable components:

```typescript
// Good: Generic repository pattern
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

## Code Formatting

### Prettier Configuration

The project uses Prettier with the following configuration (`.prettierrc`):

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### ESLint Configuration

ESLint is configured with TypeScript support (`.eslintrc.js`):

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

### Formatting Rules

- Use single quotes for strings
- Include trailing commas in multi-line structures
- Use 2 spaces for indentation
- Maximum line length: 80 characters (when practical)

## Naming Conventions

### Files and Directories

```
kebab-case.type.ts          # Files
kebab-case/                 # Directories
user.entity.ts              # Entity files
user.service.ts             # Service files
user.controller.ts          # Controller files
create-user.dto.ts          # DTO files
user.service.spec.ts        # Test files
```

### Classes and Interfaces

```typescript
// PascalCase for classes
class UserService {}
class CreateUserDto {}

// PascalCase for interfaces
interface UserRepository {}
interface DatabaseConfig {}

// PascalCase for enums
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ROOT = 'ROOT',
}
```

### Variables and Functions

```typescript
// camelCase for variables and functions
const userName = 'john_doe';
const isUserActive = true;

function getUserById(id: string): Promise<UserEntity> {}
async function createNewUser(userData: CreateUserDto): Promise<UserEntity> {}
```

### Constants

```typescript
// SCREAMING_SNAKE_CASE for constants
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 20;
const JWT_EXPIRATION_TIME = 3600;
```

### Database Naming

```typescript
// snake_case for database columns (handled by SnakeNamingStrategy)
@Entity('user_accounts')
export class UserEntity {
  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'created_at' })
  createdAt: Date;
}
```

## File Organization

### Module Structure

Each module should follow this structure:

```
modules/
└── user/
    ├── controllers/
    │   └── user.controller.ts
    ├── dtos/
    │   ├── create-user.dto.ts
    │   └── update-user.dto.ts
    ├── entities/
    │   └── user.entity.ts
    ├── services/
    │   └── user.service.ts
    ├── subscribers/
    │   └── user.subscriber.ts
    ├── templates/
    │   └── welcome.template.hbs
    └── user.module.ts
```

### Import Organization

Organize imports in the following order:

```typescript
// 1. Node.js built-in modules
import * as path from 'path';

// 2. External libraries
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// 3. Internal modules (using path aliases)
import { UserEntity } from 'modules/user/entities/user.entity';
import { CreateUserDto } from 'modules/user/dtos/create-user.dto';
import { UtilsService } from 'utils/services/utils.service';

// 4. Relative imports
import './user.types';
```

## NestJS Specific Guidelines

### Controllers

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.userService.findById(id);
  }
}
```

### Services

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
```

### DTOs

```typescript
export class CreateUserDto {
  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  firstName: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

### Entities

```typescript
@Entity('users')
export class UserEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @ApiProperty({ description: 'User email address' })
  email: string;

  @OneToMany(() => BillEntity, bill => bill.user)
  bills: BillEntity[];
}
```

## Database Guidelines

### Entity Design

- Extend `AbstractEntity` for common fields (id, createdAt, updatedAt)
- Use appropriate column types and constraints
- Define relationships clearly
- Use validation decorators

### Migrations

```typescript
export class CreateUserTable1234567890 implements MigrationInterface {
  name = 'CreateUserTable1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          // ... other columns
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Query Optimization

- Use proper indexes
- Implement pagination for large datasets
- Use select queries to limit returned fields
- Avoid N+1 query problems with proper joins

## Testing Standards

### Unit Tests

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const userId = 'test-id';
      const expectedUser = new UserEntity();
      expectedUser.id = userId;

      jest.spyOn(repository, 'findOne').mockResolvedValue(expectedUser);

      const result = await service.findById(userId);

      expect(result).toEqual(expectedUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });
});
```

### Test Organization

- One test file per source file
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `beforeEach` for common setup
- Mock external dependencies

## Documentation Standards

### Code Comments

```typescript
/**
 * Creates a new user account with the provided information.
 * Automatically generates a unique pin code and sends a welcome email.
 * 
 * @param userData - The user information for account creation
 * @returns Promise resolving to the created user entity
 * @throws ConflictException when email already exists
 * @throws BadRequestException when validation fails
 */
async createUser(userData: CreateUserDto): Promise<UserEntity> {
  // Implementation details that need explanation
  const pinCode = await this.generateUniquePinCode();
  
  // Complex business logic explanation
  if (await this.isEmailTaken(userData.email)) {
    throw new ConflictException('Email already exists');
  }
  
  return this.userRepository.save({ ...userData, pinCode });
}
```

### API Documentation

Use Swagger decorators extensively:

```typescript
@ApiOperation({ 
  summary: 'Create a new user account',
  description: 'Creates a new user with automatic pin code generation and welcome email'
})
@ApiBody({ type: CreateUserDto })
@ApiResponse({ 
  status: 201, 
  description: 'User created successfully',
  type: UserEntity 
})
@ApiResponse({ 
  status: 409, 
  description: 'Email already exists' 
})
```

## Security Guidelines

### Input Validation

Always validate input data:

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' })
  firstName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

### Password Handling

```typescript
// Good: Hash passwords before storing
const hashedPassword = await UtilsService.generateHash(plainPassword);

// Good: Compare hashed passwords
const isValid = await UtilsService.validateHash(plainPassword, hashedPassword);

// Never: Store plain text passwords
// Bad: user.password = plainPassword;
```

### JWT Security

```typescript
// Good: Use strong, configurable secrets
const jwtSecret = this.configService.get('JWT_SECRET_KEY');

// Good: Set appropriate expiration times
const expiresIn = this.configService.get('JWT_EXPIRATION_TIME');

// Good: Include necessary claims only
const payload = { sub: user.id, email: user.email, role: user.role };
```

### SQL Injection Prevention

```typescript
// Good: Use TypeORM query builder or repository methods
const user = await this.userRepository.findOne({ 
  where: { email: userEmail } 
});

// Good: Parameterized queries
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userEmail })
  .getMany();

// Never: String concatenation in queries
// Bad: `SELECT * FROM users WHERE email = '${userEmail}'`
```

## Performance Guidelines

### Database Queries

```typescript
// Good: Use select to limit fields
const users = await this.userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.firstName'])
  .getMany();

// Good: Use pagination
const [users, total] = await this.userRepository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
});

// Good: Use proper joins to avoid N+1 queries
const users = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.bills', 'bill')
  .getMany();
```

### Caching Strategies

```typescript
// Consider caching for expensive operations
@Injectable()
export class CurrencyService {
  private exchangeRateCache = new Map<string, number>();

  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}-${to}`;
    
    if (this.exchangeRateCache.has(cacheKey)) {
      return this.exchangeRateCache.get(cacheKey);
    }
    
    const rate = await this.fetchExchangeRateFromAPI(from, to);
    this.exchangeRateCache.set(cacheKey, rate);
    
    return rate;
  }
}
```

## Error Handling

### Exception Handling

```typescript
// Good: Use appropriate HTTP exceptions
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}

if (await this.isEmailTaken(email)) {
  throw new ConflictException('Email already exists');
}

if (!this.isValidInput(data)) {
  throw new BadRequestException('Invalid input data');
}

// Good: Handle and transform errors appropriately
try {
  return await this.externalApiService.fetchData();
} catch (error) {
  this.logger.error('External API call failed', error);
  throw new ServiceUnavailableException('External service temporarily unavailable');
}
```

### Logging

```typescript
// Good: Use structured logging
this.logger.log('User created successfully', { 
  userId: user.id, 
  email: user.email 
});

this.logger.error('Database operation failed', {
  operation: 'createUser',
  error: error.message,
  stack: error.stack
});

// Good: Log important business events
this.logger.log('Transaction completed', {
  transactionId: transaction.id,
  amount: transaction.amount,
  fromAccount: transaction.senderBill.accountBillNumber,
  toAccount: transaction.recipientBill.accountBillNumber
});
```

## Code Review Guidelines

### Before Submitting

- Run `yarn lint` and fix all issues
- Run `yarn test` and ensure all tests pass
- Run `yarn format` to ensure consistent formatting
- Verify all new code has appropriate test coverage
- Check that all public methods have proper documentation

### Review Checklist

- [ ] Code follows established patterns and conventions
- [ ] All new functionality has tests
- [ ] API endpoints have proper Swagger documentation
- [ ] Error handling is appropriate and consistent
- [ ] Security considerations have been addressed
- [ ] Performance implications have been considered
- [ ] Database migrations are safe and reversible
- [ ] No sensitive information is logged or exposed

## Continuous Improvement

### Refactoring Guidelines

- Refactor when adding new features that would benefit from cleaner code
- Extract common patterns into reusable utilities
- Improve test coverage during refactoring
- Update documentation when changing public interfaces

### Code Quality Metrics

Monitor and improve:

- Test coverage (aim for >80%)
- Code complexity (keep functions simple)
- Duplication (extract common code)
- Performance (monitor query times and response times)

This document is a living guide that should be updated as the project evolves and new patterns emerge.
