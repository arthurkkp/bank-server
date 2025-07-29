# Coding Standards - Bank Server

This document outlines the coding standards, best practices, and guidelines for developing the Bank Server backend application using NestJS, TypeScript, and related technologies.

## 📋 Table of Contents

- [General Principles](#general-principles)
- [TypeScript Standards](#typescript-standards)
- [NestJS Patterns](#nestjs-patterns)
- [Database and TypeORM](#database-and-typeorm)
- [API Design](#api-design)
- [Security Standards](#security-standards)
- [Banking-Specific Guidelines](#banking-specific-guidelines)
- [Testing Standards](#testing-standards)
- [Error Handling](#error-handling)
- [Performance Guidelines](#performance-guidelines)
- [Code Organization](#code-organization)

## 🎯 General Principles

### Core Development Principles

1. **SOLID Principles**
   - **Single Responsibility**: Each class should have one reason to change
   - **Open/Closed**: Open for extension, closed for modification
   - **Liskov Substitution**: Objects should be replaceable with instances of their subtypes
   - **Interface Segregation**: Many client-specific interfaces are better than one general-purpose interface
   - **Dependency Inversion**: Depend on abstractions, not concretions

2. **DRY (Don't Repeat Yourself)**
   - Extract common functionality into reusable modules
   - Use inheritance and composition appropriately
   - Create utility functions for repeated operations

3. **KISS (Keep It Simple, Stupid)**
   - Write clear, readable code
   - Avoid unnecessary complexity
   - Prefer explicit over implicit behavior

4. **YAGNI (You Aren't Gonna Need It)**
   - Don't implement features until they're needed
   - Avoid over-engineering solutions
   - Focus on current requirements

## 📝 TypeScript Standards

### Type Definitions

#### Strong Typing
```typescript
// ✅ Good: Explicit types
interface CreateTransactionDto {
  readonly amount: string;
  readonly recipientAccountId: string;
  readonly description?: string;
  readonly currency: CurrencyCode;
}

// ❌ Bad: Using 'any'
interface CreateTransactionDto {
  amount: any;
  recipientAccountId: any;
  description?: any;
}
```

#### Enums and Constants
```typescript
// ✅ Good: Use const enums for better performance
export const enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export const enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  PLN = 'PLN',
}

// ✅ Good: Use const assertions for immutable data
export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: '0.01',
  MAX_AMOUNT: '1000000.00',
  DAILY_LIMIT: '50000.00',
} as const;
```

#### Interface Design
```typescript
// ✅ Good: Descriptive interface names
interface BankAccount {
  readonly id: string;
  readonly accountNumber: string;
  readonly balance: string;
  readonly currency: CurrencyCode;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ✅ Good: Use readonly for immutable properties
interface TransactionResult {
  readonly success: boolean;
  readonly transactionId?: string;
  readonly error?: string;
  readonly timestamp: Date;
}
```

### Class Design

#### Service Classes
```typescript
// ✅ Good: Service class structure
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly accountService: AccountService,
    private readonly auditService: AuditService,
  ) {}

  async createTransaction(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResult> {
    this.logger.log(`Creating transaction for user ${userId}`);
    
    try {
      // Implementation
    } catch (error) {
      this.logger.error(`Transaction creation failed: ${error.message}`);
      throw new BadRequestException('Transaction creation failed');
    }
  }
}
```

#### Entity Classes
```typescript
// ✅ Good: Entity with proper decorators
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: CurrencyCode })
  currency: CurrencyCode;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
```

## 🏗 NestJS Patterns

### Module Organization

#### Feature Modules
```typescript
// ✅ Good: Well-organized module
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Account]),
    forwardRef(() => AccountModule),
    EmailModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionValidator,
    {
      provide: 'TRANSACTION_CONFIG',
      useValue: TRANSACTION_CONFIG,
    },
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
```

#### Controller Design
```typescript
// ✅ Good: RESTful controller with proper decorators
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiTags('Transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transaction data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTransaction(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.createTransaction(user.id, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedTransactionResponseDto> {
    return this.transactionService.getTransactions(user.id, paginationDto);
  }
}
```

### Dependency Injection

#### Provider Configuration
```typescript
// ✅ Good: Proper provider setup
@Module({
  providers: [
    TransactionService,
    {
      provide: 'CURRENCY_SERVICE',
      useClass: ExternalCurrencyService,
    },
    {
      provide: 'TRANSACTION_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxAmount: configService.get('TRANSACTION_MAX_AMOUNT'),
        dailyLimit: configService.get('TRANSACTION_DAILY_LIMIT'),
      }),
      inject: [ConfigService],
    },
  ],
})
export class TransactionModule {}
```

## 🗄 Database and TypeORM

### Entity Design

#### Banking Entity Example
```typescript
// ✅ Good: Comprehensive entity design
@Entity('accounts')
@Index(['userId', 'accountNumber'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  accountNumber: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: '0.00' })
  balance: string;

  @Column({ type: 'enum', enum: CurrencyCode, default: CurrencyCode.USD })
  currency: CurrencyCode;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, user => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, transaction => transaction.senderAccount)
  sentTransactions: Transaction[];

  @OneToMany(() => Transaction, transaction => transaction.recipientAccount)
  receivedTransactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

#### Repository Patterns
```typescript
// ✅ Good: Custom repository with banking logic
@Injectable()
export class TransactionRepository extends Repository<Transaction> {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super(Transaction, dataSource.createEntityManager());
  }

  async findTransactionsByAccount(
    accountId: string,
    pagination: PaginationDto,
  ): Promise<[Transaction[], number]> {
    const queryBuilder = this.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.senderAccount', 'senderAccount')
      .leftJoinAndSelect('transaction.recipientAccount', 'recipientAccount')
      .where('transaction.senderAccountId = :accountId OR transaction.recipientAccountId = :accountId', { accountId })
      .orderBy('transaction.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    return queryBuilder.getManyAndCount();
  }

  async calculateDailyTransactionSum(accountId: string, date: Date): Promise<string> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const result = await this.createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.senderAccountId = :accountId', { accountId })
      .andWhere('transaction.createdAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return result.total || '0.00';
  }
}
```

### Migration Best Practices

```typescript
// ✅ Good: Migration with proper constraints
export class CreateTransactionsTable1234567890 implements MigrationInterface {
  name = 'CreateTransactionsTable1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'enum',
            enum: ['USD', 'EUR', 'GBP', 'PLN'],
            default: "'USD'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'sender_account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'recipient_account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['sender_account_id'],
            referencedTableName: 'accounts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['recipient_account_id'],
            referencedTableName: 'accounts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['sender_account_id', 'created_at'],
          },
          {
            columnNames: ['recipient_account_id', 'created_at'],
          },
          {
            columnNames: ['status', 'created_at'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions');
  }
}
```

## 🌐 API Design

### DTO Design

#### Request DTOs
```typescript
// ✅ Good: Comprehensive validation
export class CreateTransactionDto {
  @ApiProperty({ description: 'Transaction amount', example: '100.50' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+\.\d{2}$/, { message: 'Amount must have exactly 2 decimal places' })
  @IsDecimalAmount()
  readonly amount: string;

  @ApiProperty({ description: 'Recipient account ID', example: 'uuid-string' })
  @IsNotEmpty()
  @IsUUID()
  readonly recipientAccountId: string;

  @ApiProperty({ description: 'Transaction description', example: 'Payment for services', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  readonly description?: string;

  @ApiProperty({ description: 'Currency code', enum: CurrencyCode, example: CurrencyCode.USD })
  @IsEnum(CurrencyCode)
  readonly currency: CurrencyCode;
}
```

#### Response DTOs
```typescript
// ✅ Good: Structured response
export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  readonly id: string;

  @ApiProperty({ description: 'Transaction amount' })
  readonly amount: string;

  @ApiProperty({ description: 'Currency code', enum: CurrencyCode })
  readonly currency: CurrencyCode;

  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus })
  readonly status: TransactionStatus;

  @ApiProperty({ description: 'Sender account information' })
  readonly senderAccount: AccountSummaryDto;

  @ApiProperty({ description: 'Recipient account information' })
  readonly recipientAccount: AccountSummaryDto;

  @ApiProperty({ description: 'Transaction description', required: false })
  readonly description?: string;

  @ApiProperty({ description: 'Transaction creation date' })
  readonly createdAt: Date;

  @ApiProperty({ description: 'Transaction last update date' })
  readonly updatedAt: Date;
}
```

### Custom Validators

```typescript
// ✅ Good: Banking-specific validators
@ValidatorConstraint({ name: 'isDecimalAmount', async: false })
export class IsDecimalAmountConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    
    const decimal = new Decimal(value);
    return decimal.gt(0) && decimal.lte(1000000) && decimal.dp() <= 2;
  }

  defaultMessage(): string {
    return 'Amount must be a positive decimal with up to 2 decimal places and not exceed 1,000,000';
  }
}

export function IsDecimalAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDecimalAmountConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isValidAccountNumber', async: true })
export class IsValidAccountNumberConstraint implements ValidatorConstraintInterface {
  constructor(private readonly accountService: AccountService) {}

  async validate(accountNumber: string): Promise<boolean> {
    if (!accountNumber) return false;
    
    const account = await this.accountService.findByAccountNumber(accountNumber);
    return account && account.isActive;
  }

  defaultMessage(): string {
    return 'Account number does not exist or is inactive';
  }
}
```

## 🔐 Security Standards

### Authentication and Authorization

#### JWT Strategy
```typescript
// ✅ Good: Secure JWT implementation
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { uuid, iat, exp } = payload;

    if (exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    const user = await this.userService.findByUuid(uuid);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

#### Guards and Decorators
```typescript
// ✅ Good: Custom authorization guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// ✅ Good: Custom decorator for user extraction
export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### Input Validation and Sanitization

```typescript
// ✅ Good: Comprehensive validation pipe
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    if (errors.length > 0) {
      const errorMessages = this.buildErrorMessage(errors);
      throw new BadRequestException(errorMessages);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private buildErrorMessage(errors: ValidationError[]): string[] {
    return errors.map(error => {
      const constraints = error.constraints;
      return Object.values(constraints || {});
    }).flat();
  }
}
```

## 🏦 Banking-Specific Guidelines

### Financial Calculations

#### Decimal Precision
```typescript
// ✅ Good: Use Decimal.js for all financial calculations
import { Decimal } from 'decimal.js';

@Injectable()
export class FinancialCalculationService {
  calculateTransactionFee(amount: string, feeRate: string): string {
    const amountDecimal = new Decimal(amount);
    const feeRateDecimal = new Decimal(feeRate);
    
    const fee = amountDecimal.mul(feeRateDecimal);
    return fee.toFixed(2);
  }

  calculateExchangeAmount(amount: string, exchangeRate: string): string {
    const amountDecimal = new Decimal(amount);
    const rateDecimal = new Decimal(exchangeRate);
    
    const convertedAmount = amountDecimal.mul(rateDecimal);
    return convertedAmount.toFixed(2);
  }

  validateTransactionAmount(amount: string): boolean {
    try {
      const decimal = new Decimal(amount);
      return decimal.gt(0) && decimal.lte(1000000) && decimal.dp() <= 2;
    } catch {
      return false;
    }
  }
}

// ❌ Bad: Using floating point arithmetic
calculateFee(amount: number, rate: number): number {
  return amount * rate; // Can cause precision errors
}
```

### Transaction Processing

#### Double-Entry Bookkeeping
```typescript
// ✅ Good: Atomic transaction processing
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) {}

  async processTransaction(
    senderId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock accounts to prevent concurrent modifications
      const senderAccount = await queryRunner.manager
        .createQueryBuilder(Account, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: senderId })
        .getOne();

      const recipientAccount = await queryRunner.manager
        .createQueryBuilder(Account, 'account')
        .setLock('pessimistic_write')
        .where('account.id = :id', { id: createTransactionDto.recipientAccountId })
        .getOne();

      if (!senderAccount || !recipientAccount) {
        throw new NotFoundException('Account not found');
      }

      // Validate sufficient balance
      const senderBalance = new Decimal(senderAccount.balance);
      const transactionAmount = new Decimal(createTransactionDto.amount);

      if (senderBalance.lt(transactionAmount)) {
        throw new BadRequestException('Insufficient funds');
      }

      // Create transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        amount: createTransactionDto.amount,
        currency: createTransactionDto.currency,
        senderAccount,
        recipientAccount,
        description: createTransactionDto.description,
        status: TransactionStatus.PENDING,
      });

      await queryRunner.manager.save(transaction);

      // Update account balances
      senderAccount.balance = senderBalance.minus(transactionAmount).toFixed(2);
      recipientAccount.balance = new Decimal(recipientAccount.balance)
        .plus(transactionAmount)
        .toFixed(2);

      await queryRunner.manager.save([senderAccount, recipientAccount]);

      // Mark transaction as completed
      transaction.status = TransactionStatus.COMPLETED;
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        success: true,
        transactionId: transaction.id,
        timestamp: new Date(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Audit Logging

```typescript
// ✅ Good: Comprehensive audit logging
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async logUserAction(
    userId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        userId,
        action,
        details: this.sanitizeAuditData(details),
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to log audit entry: ${error.message}`);
    }
  }

  private sanitizeAuditData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.authKey;
    delete sanitized.accountNumber;
    
    // Redact financial amounts in production
    if (process.env.NODE_ENV === 'production') {
      if (sanitized.amount) {
        sanitized.amount = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
```

## 🧪 Testing Standards

### Test Structure

#### Unit Tests
```typescript
// ✅ Good: Comprehensive unit test
describe('TransactionService', () => {
  let service: TransactionService;
  let mockTransactionRepository: jest.Mocked<Repository<Transaction>>;
  let mockAccountService: jest.Mocked<AccountService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: createMockRepository(),
        },
        {
          provide: AccountService,
          useValue: createMockAccountService(),
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    mockTransactionRepository = module.get(getRepositoryToken(Transaction));
    mockAccountService = module.get(AccountService);
  });

  describe('createTransaction', () => {
    it('should create a valid transaction', async () => {
      // Arrange
      const userId = 'user-123';
      const createTransactionDto: CreateTransactionDto = {
        amount: '100.50',
        recipientAccountId: 'account-456',
        currency: CurrencyCode.USD,
        description: 'Test payment',
      };

      mockAccountService.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      // Act
      const result = await service.createTransaction(userId, createTransactionDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '100.50',
          currency: CurrencyCode.USD,
        }),
      );
    });

    it('should throw error for insufficient funds', async () => {
      // Arrange
      const userId = 'user-123';
      const createTransactionDto: CreateTransactionDto = {
        amount: '1000.00',
        recipientAccountId: 'account-456',
        currency: CurrencyCode.USD,
      };

      mockAccountService.findById.mockResolvedValue({
        ...mockAccount,
        balance: '500.00',
      });

      // Act & Assert
      await expect(
        service.createTransaction(userId, createTransactionDto),
      ).rejects.toThrow('Insufficient funds');
    });
  });
});
```

#### Integration Tests
```typescript
// ✅ Good: Integration test with database
describe('TransactionController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(createTestDataSource())
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    await app.init();
    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    await seedTestData(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /transactions', () => {
    it('should create a transaction successfully', async () => {
      const authToken = await getAuthToken(app, testUser);
      
      const createTransactionDto = {
        amount: '100.50',
        recipientAccountId: testRecipientAccount.id,
        currency: 'USD',
        description: 'Integration test payment',
      };

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTransactionDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        amount: '100.50',
        currency: 'USD',
        status: 'pending',
      });

      // Verify database state
      const transaction = await dataSource
        .getRepository(Transaction)
        .findOne({ where: { id: response.body.id } });
      
      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe('100.50');
    });
  });
});
```

### Banking-Specific Testing

#### Financial Calculation Tests
```typescript
// ✅ Good: Decimal precision testing
describe('Financial Calculations', () => {
  describe('Currency Conversion', () => {
    it('should maintain precision in currency conversion', () => {
      const amount = new Decimal('100.50');
      const exchangeRate = new Decimal('1.2345');
      
      const result = amount.mul(exchangeRate);
      
      expect(result.toFixed(2)).toBe('124.07');
      expect(result.dp()).toBeLessThanOrEqual(2);
    });

    it('should handle edge cases in conversion', () => {
      // Test very small amounts
      const smallAmount = new Decimal('0.01');
      const rate = new Decimal('1.5');
      const result = smallAmount.mul(rate);
      
      expect(result.toFixed(2)).toBe('0.02');
      
      // Test large amounts
      const largeAmount = new Decimal('999999.99');
      const largeResult = largeAmount.mul(rate);
      
      expect(largeResult.toFixed(2)).toBe('1499999.99');
    });
  });

  describe('Transaction Fee Calculation', () => {
    it('should calculate fees correctly', () => {
      const amount = new Decimal('1000.00');
      const feeRate = new Decimal('0.025'); // 2.5%
      
      const fee = amount.mul(feeRate);
      
      expect(fee.toFixed(2)).toBe('25.00');
    });

    it('should apply minimum and maximum fee limits', () => {
      const minFee = new Decimal('1.00');
      const maxFee = new Decimal('100.00');
      
      // Test minimum fee
      const smallAmount = new Decimal('10.00');
      const smallFee = Decimal.max(smallAmount.mul('0.025'), minFee);
      expect(smallFee.toFixed(2)).toBe('1.00');
      
      // Test maximum fee
      const largeAmount = new Decimal('10000.00');
      const largeFee = Decimal.min(largeAmount.mul('0.025'), maxFee);
      expect(largeFee.toFixed(2)).toBe('100.00');
    });
  });
});
```

## ⚠️ Error Handling

### Exception Filters

```typescript
// ✅ Good: Banking-specific exception filter
@Catch()
export class BankingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BankingExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      errorCode = 'DATABASE_ERROR';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error for audit purposes
    this.logger.error(
      `${request.method} ${request.url}`,
      {
        statusCode: status,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
        userId: request.user?.id,
        ip: request.ip,
        userAgent: request.get('User-Agent'),
      },
    );

    // Don't expose sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        message = 'An unexpected error occurred';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Custom Exceptions

```typescript
// ✅ Good: Banking-specific exceptions
export class InsufficientFundsException extends BadRequestException {
  constructor(availableBalance: string, requestedAmount: string) {
    super({
      message: 'Insufficient funds for this transaction',
      errorCode: 'INSUFFICIENT_FUNDS',
      availableBalance,
      requestedAmount,
    });
  }
}

export class InvalidTransactionException extends BadRequestException {
  constructor(reason: string) {
    super({
      message: 'Invalid transaction',
      errorCode: 'INVALID_TRANSACTION',
      reason,
    });
  }
}

export class AccountNotFoundException extends NotFoundException {
  constructor(accountId: string) {
    super({
      message: 'Account not found',
      errorCode: 'ACCOUNT_NOT_FOUND',
      accountId,
    });
  }
}
```

## ⚡ Performance Guidelines

### Database Optimization

#### Query Optimization
```typescript
// ✅ Good: Optimized queries with proper indexing
@Injectable()
export class TransactionService {
  async getTransactionHistory(
    userId: string,
    pagination: PaginationDto,
    filters: TransactionFiltersDto,
  ): Promise<PaginatedResult<Transaction>> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.senderAccount', 'senderAccount')
      .leftJoinAndSelect('transaction.recipientAccount', 'recipientAccount')
      .where('senderAccount.userId = :userId OR recipientAccount.userId = :userId', { userId });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('transaction.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('transaction.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    // Optimize with proper ordering and pagination
    queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      data: transactions,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }
}
```

#### Caching Strategy
```typescript
// ✅ Good: Caching for frequently accessed data
@Injectable()
export class CurrencyService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {}

  async getExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
    const cacheKey = `exchange_rates_${baseCurrency}`;
    
    // Try to get from cache first
    const cachedRates = await this.cacheManager.get<ExchangeRates>(cacheKey);
    if (cachedRates) {
      return cachedRates;
    }

    // Fetch from external API
    const response = await this.httpService
      .get(`${this.currencyApiUrl}/${baseCurrency}`)
      .toPromise();

    const rates = response.data;

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, rates, 3600);

    return rates;
  }
}
```

## 📁 Code Organization

### Module Structure

```typescript
// ✅ Good: Well-organized module structure
transaction/
├── controllers/
│   └── transaction.controller.ts
├── services/
│   ├── transaction.service.ts
│   └── transaction-validation.service.ts
├── entities/
│   └── transaction.entity.ts
├── dto/
│   ├── create-transaction.dto.ts
│   ├── update-transaction.dto.ts
│   └── transaction-response.dto.ts
├── repositories/
│   └── transaction.repository.ts
├── guards/
│   └── transaction-ownership.guard.ts
├── decorators/
│   └── transaction-audit.decorator.ts
└── transaction.module.ts
```

### File Naming Conventions

- **Controllers**: `*.controller.ts`
- **Services**: `*.service.ts`
- **Entities**: `*.entity.ts`
- **DTOs**: `*.dto.ts`
- **Guards**: `*.guard.ts`
- **Decorators**: `*.decorator.ts`
- **Pipes**: `*.pipe.ts`
- **Filters**: `*.filter.ts`
- **Interceptors**: `*.interceptor.ts`
- **Tests**: `*.spec.ts` or `*.e2e-spec.ts`

### Import Organization

```typescript
// ✅ Good: Organized imports
// Node modules
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';

// Local modules
import { Transaction } from './entities/transaction.entity';
import { Account } from '../account/entities/account.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResult } from './interfaces/transaction-result.interface';
import { AccountService } from '../account/services/account.service';
import { AuditService } from '../audit/services/audit.service';

// Types and enums
import { TransactionStatus, CurrencyCode } from './enums';
```

This comprehensive coding standards document ensures that all developers working on the Bank Server follow consistent, secure, and maintainable practices specific to banking applications.
