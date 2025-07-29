# Contributing Guide - Bank Server

Welcome to the Bank Server project! This guide will help you understand how to contribute effectively to our banking application backend.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Banking-Specific Guidelines](#banking-specific-guidelines)
- [Security Considerations](#security-considerations)
- [Review Process](#review-process)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or experience level.

### Expected Behavior

- **Be respectful** and considerate in all interactions
- **Be collaborative** and help others learn and grow
- **Be constructive** when providing feedback
- **Focus on the code**, not the person
- **Respect different viewpoints** and experiences

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Publishing private information without permission
- Any behavior that would be inappropriate in a professional setting

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** v16.14+ (LTS recommended)
- **yarn** v1.22+ package manager
- **PostgreSQL** v12+ database
- **Git** for version control
- **Code editor** with TypeScript and ESLint support

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
```bash
git clone https://github.com/YOUR_USERNAME/bank-server.git
cd bank-server
```

3. **Add upstream remote:**
```bash
git remote add upstream https://github.com/akkp-windsurf/bank-server.git
```

4. **Install dependencies:**
```bash
yarn install
```

5. **Setup environment:**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

6. **Setup database:**
```bash
# Create PostgreSQL database
createdb bank_dev

# Run migrations
yarn migration:run

# Seed test data (optional)
yarn seed:run
```

7. **Verify setup:**
```bash
yarn test
yarn lint
yarn start:dev
```

## 🔄 Development Workflow

### Branch Strategy

We use **Git Flow** with the following branch types:

- **`master`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/`** - New features or enhancements
- **`bugfix/`** - Bug fixes
- **`hotfix/`** - Critical production fixes
- **`security/`** - Security-related fixes

### Branch Naming Convention

```
feature/ISSUE_NUMBER-short-description
bugfix/ISSUE_NUMBER-short-description
hotfix/ISSUE_NUMBER-short-description
security/ISSUE_NUMBER-short-description

Examples:
feature/123-transaction-validation
bugfix/456-jwt-token-refresh
hotfix/789-sql-injection-fix
security/101-password-hashing-upgrade
```

### Development Process

1. **Create a new branch:**
```bash
git checkout develop
git pull upstream develop
git checkout -b feature/123-transaction-validation
```

2. **Make your changes** following our coding standards

3. **Test your changes:**
```bash
yarn test
yarn test:e2e
yarn lint
yarn build
```

4. **Commit your changes:**
```bash
git add src/modules/transaction/
git commit -m "feat(transaction): add amount validation with decimal precision

- Implement Decimal.js for financial calculations
- Add comprehensive input validation
- Include unit tests for edge cases
- Update API documentation

Closes #123"
```

5. **Push to your fork:**
```bash
git push origin feature/123-transaction-validation
```

6. **Create a Pull Request** on GitHub

### Commit Message Convention

We follow **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, etc.)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks
- **security:** Security-related changes

#### Examples

```bash
feat(auth): implement JWT refresh token mechanism
fix(transaction): resolve decimal precision error in calculations
docs(api): update Swagger documentation for payment endpoints
test(user): add unit tests for password validation
security(auth): upgrade bcrypt salt rounds to 12
```

## 📏 Coding Standards

All contributions must follow our [Coding Standards](./CODING_STANDARDS.md). Key requirements:

### Code Quality

- **ESLint compliance** - All code must pass ESLint checks
- **TypeScript strict mode** - Proper type definitions required
- **Test coverage** - 90% minimum coverage requirement
- **Documentation** - JSDoc comments for public APIs

### NestJS Patterns

- **Dependency injection** - Use NestJS DI container
- **Decorators** - Proper use of NestJS decorators
- **Guards and interceptors** - For cross-cutting concerns
- **DTOs** - Data transfer objects with validation

### Banking-Specific Requirements

- **Decimal.js** for financial calculations
- **Input validation** for all financial data
- **Audit logging** for sensitive operations
- **Security headers** in API responses

## 🧪 Testing Requirements

### Coverage Requirements

All contributions must maintain our strict testing standards:

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

### Test Types Required

1. **Unit Tests** - All services and utilities
2. **Integration Tests** - API endpoints
3. **E2E Tests** - Critical user workflows
4. **Security Tests** - Authentication and authorization

### Banking-Specific Testing

```typescript
// Example: Financial calculation tests
describe('TransactionService', () => {
  it('should maintain decimal precision in calculations', () => {
    const amount = new Decimal('100.50');
    const fee = new Decimal('2.50');
    const total = amount.plus(fee);
    
    expect(total.toString()).toBe('103.00');
  });

  it('should validate transaction limits', () => {
    const amount = new Decimal('1000000.01');
    const isValid = validateTransactionAmount(amount.toString());
    
    expect(isValid).toBe(false);
  });

  it('should prevent double spending', async () => {
    const transactionData = createMockTransaction();
    
    await service.createTransaction(transactionData);
    
    await expect(
      service.createTransaction(transactionData)
    ).rejects.toThrow('Duplicate transaction');
  });
});
```

## 📝 Pull Request Process

### Before Creating a PR

1. **Sync with upstream:**
```bash
git checkout develop
git pull upstream develop
git checkout your-feature-branch
git rebase develop
```

2. **Run all checks:**
```bash
yarn test:cov
yarn test:e2e
yarn lint
yarn build
```

3. **Update documentation** if needed

### PR Requirements

- **Clear title** following conventional commits
- **Detailed description** of changes
- **Test results** showing coverage
- **Security considerations** documented
- **Breaking changes** clearly marked

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Security fix
- [ ] Documentation update

## Banking Security Checklist
- [ ] Financial calculations use Decimal.js
- [ ] Input validation implemented
- [ ] Authentication checks in place
- [ ] Audit logging added
- [ ] No sensitive data exposed

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Test coverage meets requirements
- [ ] All existing tests pass

## Documentation
- [ ] Code comments added where necessary
- [ ] API documentation updated
- [ ] README updated if needed
```

## 🏦 Banking-Specific Guidelines

### Financial Data Handling

```typescript
// ✅ Correct: Use Decimal.js for all financial calculations
import { Decimal } from 'decimal.js';

const calculateInterest = (principal: string, rate: string, time: string): string => {
  const p = new Decimal(principal);
  const r = new Decimal(rate);
  const t = new Decimal(time);
  
  return p.mul(r).mul(t).toFixed(2);
};

// ❌ Wrong: Using floating point arithmetic
const calculateInterest = (principal: number, rate: number, time: number): number => {
  return principal * rate * time; // Can cause precision errors
};
```

### Security Requirements

- **Input sanitization** for all user inputs
- **SQL injection prevention** using TypeORM parameterized queries
- **XSS protection** with proper output encoding
- **Rate limiting** for API endpoints
- **Secure password hashing** with bcrypt

### Compliance Considerations

- **GDPR compliance** for user data handling
- **PCI DSS** awareness for payment processing
- **Audit trails** for all financial transactions
- **Data retention** policies implementation
- **Privacy by design** principles

## 🔐 Security Considerations

### Authentication

- **JWT tokens** must be properly validated
- **Token expiration** must be handled gracefully
- **Refresh tokens** should be implemented securely
- **Session management** must be secure

### Data Protection

```typescript
// Example: Secure API endpoint
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Transactions')
export class TransactionController {
  @Post()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Create a new transaction' })
  async createTransaction(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    // Validate user permissions
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    // Sanitize input data
    const sanitizedDto = this.sanitizeTransactionData(createTransactionDto);

    // Process transaction
    const result = await this.transactionService.createTransaction(
      user.id,
      sanitizedDto,
    );

    // Log audit trail
    await this.auditService.logUserAction(
      user.id,
      'TRANSACTION_CREATED',
      { transactionId: result.id },
    );

    return result;
  }
}
```

## 👥 Review Process

### Code Review Checklist

#### General Code Quality
- [ ] Code follows ESLint rules
- [ ] TypeScript types are properly defined
- [ ] Error handling is comprehensive
- [ ] No hardcoded values or secrets
- [ ] Performance implications considered

#### NestJS Specific
- [ ] Proper use of decorators
- [ ] Dependency injection implemented correctly
- [ ] Guards and interceptors used appropriately
- [ ] DTOs with validation decorators
- [ ] Swagger documentation updated

#### Banking/Security Specific
- [ ] Financial calculations use Decimal.js
- [ ] Security measures implemented
- [ ] Compliance requirements met
- [ ] Audit logging in place
- [ ] Data protection measures

#### Testing
- [ ] Adequate test coverage
- [ ] Edge cases covered
- [ ] Banking scenarios tested
- [ ] Security tests included
- [ ] Performance tests where applicable

### Review Timeline

- **Initial review**: Within 24 hours
- **Follow-up reviews**: Within 12 hours
- **Final approval**: Within 48 hours of submission

### Review Criteria

1. **Functionality**: Does the code work as intended?
2. **Security**: Are there any security vulnerabilities?
3. **Performance**: Will this impact application performance?
4. **Maintainability**: Is the code easy to understand and maintain?
5. **Testing**: Is the code adequately tested?
6. **Documentation**: Is the code properly documented?

## 📚 Resources

### Documentation
- [Coding Standards](./CODING_STANDARDS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Testing Guide](./TESTING.md)
- [Debugging Guide](./DEBUGGING.md)

### External Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Jest Testing Framework](https://jestjs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Banking Standards
- [PCI DSS Guidelines](https://www.pcisecuritystandards.org/)
- [GDPR Compliance](https://gdpr.eu/)
- [OWASP Security Guidelines](https://owasp.org/)

Thank you for contributing to the Bank Server project!
