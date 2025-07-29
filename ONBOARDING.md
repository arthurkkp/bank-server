# Onboarding Guide - Bank Server

Welcome to the Bank Server development team! This comprehensive guide will help you get up to speed with our NestJS backend application, banking domain knowledge, and development practices.

## 📋 Table of Contents

- [Welcome](#welcome)
- [Banking Domain Overview](#banking-domain-overview)
- [Technical Architecture](#technical-architecture)
- [Development Environment Setup](#development-environment-setup)
- [Codebase Walkthrough](#codebase-walkthrough)
- [Banking Security Training](#banking-security-training)
- [Development Workflow](#development-workflow)
- [Testing Procedures](#testing-procedures)
- [Compliance and Regulations](#compliance-and-regulations)
- [Resources and Support](#resources-and-support)

## 🎯 Welcome

### About the Bank Server

The Bank Server is a secure, scalable NestJS backend application that powers our banking platform. It handles:

- **User Authentication & Authorization** - Secure JWT-based authentication
- **Account Management** - Multi-currency account operations
- **Transaction Processing** - Real-time payment processing with double-entry bookkeeping
- **Currency Exchange** - Multi-currency support with real-time rates
- **Compliance & Audit** - Comprehensive audit logging and regulatory compliance
- **Security** - Banking-grade security measures and fraud detection

### Team Structure

- **Backend Team** - NestJS/TypeScript developers
- **Frontend Team** - React/TypeScript developers
- **DevOps Team** - Infrastructure and deployment
- **Security Team** - Security audits and compliance
- **QA Team** - Testing and quality assurance

## 🏦 Banking Domain Overview

### Core Banking Concepts

#### Double-Entry Bookkeeping
Every financial transaction affects at least two accounts:
```typescript
// Example: Transfer $100 from Account A to Account B
const journalEntry = {
  description: 'Transfer between accounts',
  entries: [
    { account: 'Account A', debit: 0, credit: 100 },      // Money leaving
    { account: 'Account B', debit: 100, credit: 0 },      // Money entering
  ],
};
// Total debits must equal total credits
```

#### Financial Precision
Always use `Decimal.js` for monetary calculations:
```typescript
import { Decimal } from 'decimal.js';

// ❌ Wrong - JavaScript floating point issues
const result = 0.1 + 0.2; // 0.30000000000000004

// ✅ Correct - Precise decimal arithmetic
const result = new Decimal('0.1').plus(new Decimal('0.2')); // 0.3
```

#### Account Types
- **Assets** - Cash, checking accounts, savings accounts
- **Liabilities** - Credit cards, loans, mortgages
- **Equity** - Owner's equity, retained earnings
- **Income** - Interest earned, fees collected
- **Expenses** - Operating costs, transaction fees

### Banking Regulations

#### Key Compliance Requirements
- **PCI DSS** - Payment card industry security standards
- **GDPR** - Data protection and privacy regulations
- **AML** - Anti-money laundering requirements
- **KYC** - Know your customer verification
- **SOX** - Financial reporting accuracy

## 🏗 Technical Architecture

### Technology Stack

#### Core Technologies
- **Runtime** - Node.js 16+ LTS
- **Framework** - NestJS (Express-based)
- **Language** - TypeScript
- **Database** - PostgreSQL with TypeORM
- **Authentication** - JWT with Passport
- **Validation** - class-validator
- **Testing** - Jest
- **Documentation** - Swagger/OpenAPI

#### Key Libraries
```json
{
  "dependencies": {
    "@nestjs/core": "^9.0.0",
    "@nestjs/typeorm": "^9.0.0",
    "typeorm": "^0.3.0",
    "decimal.js": "^10.4.0",
    "bcrypt": "^5.1.0",
    "passport-jwt": "^4.0.0"
  }
}
```

### Application Structure

```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── user/         # User management
│   ├── account/      # Bank account operations
│   ├── transaction/  # Payment processing
│   └── currency/     # Exchange rate management
├── guards/           # Security guards
├── interceptors/     # Request/response interceptors
├── decorators/       # Custom decorators
├── utils/           # Utility functions
└── main.ts          # Application entry point
```

## 🛠 Development Environment Setup

### Prerequisites Checklist

- [ ] Node.js 16.14+ installed
- [ ] Yarn package manager installed
- [ ] PostgreSQL 12+ installed and running
- [ ] Git configured with your credentials
- [ ] VS Code or preferred IDE installed

### Step-by-Step Setup

#### 1. Clone and Install
```bash
git clone https://github.com/akkp-windsurf/bank-server.git
cd bank-server
yarn install
```

#### 2. Database Setup
```bash
# Create development database
sudo -u postgres createdb bank_dev
sudo -u postgres createuser bank_user

# Set password and permissions
sudo -u postgres psql
ALTER USER bank_user WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE bank_dev TO bank_user;
\q
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

#### 4. Run Migrations and Start
```bash
# Run database migrations
yarn migration:run

# Start development server
yarn start:dev

# Verify setup
curl http://localhost:4000/bank/health
```

### Development Tools Setup

#### VS Code Extensions
- TypeScript Hero
- ESLint
- Prettier
- GitLens
- Thunder Client (API testing)

#### Recommended Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 📚 Codebase Walkthrough

### Module Structure

#### Authentication Module
```typescript
// src/modules/auth/auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

#### Transaction Module
```typescript
// src/modules/transaction/transaction.service.ts
@Injectable()
export class TransactionService {
  async createTransaction(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    // 1. Validate transaction data
    await this.validateTransaction(createTransactionDto);
    
    // 2. Check account balances
    await this.checkSufficientFunds(userId, createTransactionDto.amount);
    
    // 3. Process transaction with database transaction
    return this.processTransactionSafely(userId, createTransactionDto);
  }
}
```

### Security Implementation

#### JWT Authentication
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.userService.findByUuid(payload.uuid);
  }
}
```

#### Authorization Guards
```typescript
// src/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

### Database Design

#### Entity Relationships
```typescript
// src/modules/transaction/entities/transaction.entity.ts
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: string;

  @Column()
  currency: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'sender_account_id' })
  senderAccount: Account;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'recipient_account_id' })
  recipientAccount: Account;

  @CreateDateColumn()
  createdAt: Date;
}
```

## 🔒 Banking Security Training

### Security Principles

#### 1. Defense in Depth
Multiple layers of security controls:
- Network security (firewalls, VPNs)
- Application security (authentication, authorization)
- Data security (encryption, access controls)
- Monitoring and logging

#### 2. Principle of Least Privilege
Users and systems should have only the minimum access required:
```typescript
// ✅ Good - Specific role-based access
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ACCOUNT_MANAGER)
@Get('sensitive-data')
async getSensitiveData() { ... }

// ❌ Bad - Overly broad access
@Get('sensitive-data')
async getSensitiveData() { ... }
```

#### 3. Secure by Default
Default configurations should be secure:
```typescript
// ✅ Good - Secure defaults
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  optionsSuccessStatus: 200,
};

// ❌ Bad - Insecure defaults
const corsOptions = {
  origin: '*',
  credentials: true,
};
```

### Common Security Vulnerabilities

#### SQL Injection Prevention
```typescript
// ✅ Good - Parameterized queries
const transactions = await this.transactionRepository
  .createQueryBuilder('transaction')
  .where('transaction.userId = :userId', { userId })
  .getMany();

// ❌ Bad - String concatenation
const query = `SELECT * FROM transactions WHERE user_id = '${userId}'`;
```

#### XSS Prevention
```typescript
// ✅ Good - Input sanitization
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;
}

// ❌ Bad - No input validation
export class CreateTransactionDto {
  description: string;
}
```

### Sensitive Data Handling

#### Data Classification
- **Public** - Marketing materials, public documentation
- **Internal** - Business processes, internal communications
- **Confidential** - Customer data, financial records
- **Restricted** - Authentication credentials, encryption keys

#### Secure Logging
```typescript
// ✅ Good - Sanitized logging
this.logger.log('Transaction created', {
  transactionId: transaction.id,
  amount: transaction.amount,
  userId: transaction.userId,
  // No sensitive account numbers or personal data
});

// ❌ Bad - Sensitive data in logs
this.logger.log('Transaction created', {
  accountNumber: transaction.accountNumber,
  ssn: user.ssn,
  creditCardNumber: payment.cardNumber,
});
```

## 🔄 Development Workflow

### Git Workflow

#### Branch Naming Convention
```bash
# Feature branches
feature/JIRA-123-transaction-validation
feature/456-multi-currency-support

# Bug fixes
bugfix/JIRA-789-jwt-token-refresh
bugfix/101-decimal-precision-error

# Hotfixes
hotfix/JIRA-999-security-vulnerability
```

#### Commit Message Format
```bash
# Format: type(scope): description
feat(transaction): add multi-currency support
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
test(transaction): add unit tests for fee calculation
```

### Code Review Process

#### Review Checklist
- [ ] Code follows established patterns and conventions
- [ ] Security considerations addressed
- [ ] Banking domain logic is correct
- [ ] Tests are comprehensive and passing
- [ ] Documentation is updated
- [ ] No hardcoded secrets or credentials

#### Banking-Specific Review Points
- [ ] Financial calculations use Decimal.js
- [ ] Transaction flows follow double-entry principles
- [ ] Audit logging is implemented
- [ ] Input validation prevents injection attacks
- [ ] Error messages don't expose sensitive information

### Daily Development Process

#### Morning Routine
```bash
# Update local repository
git checkout develop
git pull origin develop

# Install any new dependencies
yarn install

# Start development server
yarn start:dev

# Run tests in watch mode (separate terminal)
yarn test:watch
```

#### Before Committing
```bash
# Run quality checks
yarn lint
yarn test
yarn build

# Stage and commit changes
git add src/modules/transaction/
git commit -m "feat(transaction): add currency conversion validation"

# Push to remote
git push origin feature/currency-validation
```

## 🧪 Testing Procedures

### Testing Strategy

#### Test Types
1. **Unit Tests** (60%) - Individual functions and methods
2. **Integration Tests** (30%) - API endpoints and database operations
3. **E2E Tests** (10%) - Complete user workflows

#### Banking-Specific Testing

##### Financial Calculation Tests
```typescript
describe('Financial Calculations', () => {
  it('should maintain precision in currency conversion', () => {
    const amount = new Decimal('100.50');
    const rate = new Decimal('1.2345');
    const result = convertCurrency(amount, rate);
    
    expect(result.toString()).toBe('124.07');
  });
});
```

##### Security Tests
```typescript
describe('Security', () => {
  it('should reject unauthorized access', async () => {
    const response = await request(app.getHttpServer())
      .get('/transactions')
      .expect(401);
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:cov

# Run specific test file
yarn test transaction.service.spec.ts

# Run tests in watch mode
yarn test:watch

# Run E2E tests
yarn test:e2e
```

## 📋 Compliance and Regulations

### Audit Requirements

#### Audit Logging
All sensitive operations must be logged:
```typescript
@Injectable()
export class AuditService {
  async logTransaction(
    userId: string,
    action: string,
    transactionId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    const auditLog = this.auditRepository.create({
      userId,
      action,
      resourceId: transactionId,
      resourceType: 'TRANSACTION',
      metadata: this.sanitizeMetadata(metadata),
      timestamp: new Date(),
    });

    await this.auditRepository.save(auditLog);
  }
}
```

#### Data Retention
- **Transaction Records** - 7 years
- **Audit Logs** - 10 years
- **User Sessions** - 30 days
- **Personal Data** - 6 years (GDPR compliance)

### Regulatory Compliance

#### PCI DSS Requirements
- Secure cardholder data storage
- Encrypt transmission of cardholder data
- Maintain vulnerability management program
- Implement strong access control measures

#### GDPR Requirements
- Lawful basis for processing personal data
- Data subject rights (access, rectification, erasure)
- Privacy by design and by default
- Data breach notification procedures

## 📚 Resources and Support

### Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Banking API Documentation](http://localhost:4000/bank/api-docs)
- [Internal Wiki](https://wiki.company.com/banking-platform)

### Learning Resources

#### Banking Domain
- "Banking Fundamentals" - Internal training course
- "Double-Entry Bookkeeping Principles" - Finance team presentation
- "Regulatory Compliance Overview" - Legal team documentation

#### Technical Skills
- "Advanced TypeScript Patterns" - Tech talk recordings
- "NestJS Best Practices" - Team knowledge base
- "Database Optimization" - DBA team guidelines

### Getting Help

#### Team Contacts
- **Tech Lead** - @tech-lead (Slack)
- **Senior Developers** - #backend-team (Slack channel)
- **Security Team** - @security-team (urgent security issues)
- **DevOps Team** - #devops (deployment and infrastructure)

#### Escalation Process
1. **Self-Service** (5-10 minutes) - Check documentation and troubleshooting guides
2. **Team Help** (15-30 minutes) - Ask in team Slack channels
3. **Senior Developer** (30+ minutes) - Direct message senior team members
4. **Tech Lead** - Complex architectural decisions or urgent issues

### First Week Checklist

#### Day 1-2: Environment Setup
- [ ] Complete development environment setup
- [ ] Run application successfully
- [ ] Access all necessary tools and accounts
- [ ] Join relevant Slack channels and meetings

#### Day 3-4: Codebase Exploration
- [ ] Complete codebase walkthrough
- [ ] Understand module structure and relationships
- [ ] Review key banking domain concepts
- [ ] Read through existing tests and documentation

#### Day 5: First Contribution
- [ ] Pick up a small bug fix or documentation task
- [ ] Create feature branch and implement changes
- [ ] Submit pull request for code review
- [ ] Address feedback and merge changes

### Ongoing Development

#### Weekly Goals
- Contribute to at least one feature or bug fix
- Participate in code reviews for team members
- Attend team meetings and knowledge sharing sessions
- Stay updated on banking regulations and security practices

#### Monthly Goals
- Complete assigned features within sprint timelines
- Mentor new team members when they join
- Contribute to technical documentation and best practices
- Participate in architecture discussions and planning

Welcome to the team! We're excited to have you contribute to building secure, reliable banking software. Don't hesitate to ask questions and seek help as you get up to speed.
