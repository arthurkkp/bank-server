# Testing Guide - Bank Server

This comprehensive guide covers testing strategies, procedures, and requirements for the Bank Server backend application with a focus on banking-specific scenarios and security testing.

## 📋 Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Setup](#testing-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Banking-Specific Testing](#banking-specific-testing)
- [Security Testing](#security-testing)
- [Performance Testing](#performance-testing)
- [Coverage Requirements](#coverage-requirements)
- [Testing Best Practices](#testing-best-practices)

## 🎯 Testing Philosophy

### Banking Application Testing Principles

1. **Financial Accuracy** - All monetary calculations must be precise
2. **Security First** - Every feature must be tested for security vulnerabilities
3. **Compliance** - Tests must verify regulatory compliance requirements
4. **Data Integrity** - Ensure all financial data remains consistent
5. **Audit Trail** - All operations must be properly logged and traceable

### Test Pyramid Structure

```
    /\
   /  \     E2E Tests (10%)
  /____\    - Critical banking workflows
 /      \   - Cross-service integration
/________\  Integration Tests (30%)
           - API endpoint testing
           - Database integration
___________
           Unit Tests (60%)
           - Service logic
           - Utility functions
           - Validation logic
```

## 🔧 Testing Setup

### Jest Configuration

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
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
```

### Test Database Setup

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
    logging: false,
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

## 🧪 Unit Testing

### Service Testing Example

```typescript
// src/modules/transaction/services/transaction.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { Decimal } from 'decimal.js';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  describe('calculateTransactionFee', () => {
    it('should calculate fees with correct precision', () => {
      const amount = new Decimal('1000.00');
      const feeRate = new Decimal('0.025');
      
      const fee = service.calculateTransactionFee(amount, feeRate);
      
      expect(fee.toString()).toBe('25.00');
    });

    it('should handle edge cases', () => {
      // Very small amounts
      expect(service.calculateTransactionFee('0.01', '0.025')).toBe('0.00');
      
      // Large amounts
      expect(service.calculateTransactionFee('999999.99', '0.025')).toBe('25000.00');
    });
  });
});
```

## 🔗 Integration Testing

### API Integration Tests

```typescript
// test/transaction.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/transactions (POST)', () => {
    it('should create a transaction successfully', async () => {
      const authToken = await getAuthToken(app);
      
      const createTransactionDto = {
        amount: '100.50',
        recipientAccountId: 'recipient-account-id',
        currency: 'USD',
        description: 'Integration test payment',
      };

      const response = await request(app.getHttpServer())
        .post('/bank/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTransactionDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        amount: '100.50',
        currency: 'USD',
        status: 'pending',
      });
    });
  });
});
```

## 🏦 Banking-Specific Testing

### Financial Calculation Tests

```typescript
describe('Financial Calculations', () => {
  describe('Currency Conversion', () => {
    it('should maintain precision in conversion', () => {
      const amount = new Decimal('100.50');
      const rate = new Decimal('1.2345');
      const result = amount.mul(rate);
      
      expect(result.toFixed(2)).toBe('124.07');
    });
  });

  describe('Double-Entry Bookkeeping', () => {
    it('should create balanced journal entries', () => {
      const entries = service.createJournalEntry({
        description: 'Transfer between accounts',
        entries: [
          { account: 'Cash', debit: new Decimal('1000.00'), credit: new Decimal('0') },
          { account: 'Checking Account', debit: new Decimal('0'), credit: new Decimal('1000.00') },
        ],
      });

      expect(entries.isBalanced()).toBe(true);
      expect(entries.getTotalDebits().toString()).toBe('1000.00');
      expect(entries.getTotalCredits().toString()).toBe('1000.00');
    });
  });
});
```

## 🔒 Security Testing

### Authentication Tests

```typescript
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
      
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should enforce rate limiting', async () => {
      const token = await getValidToken();
      
      const promises = Array(15).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/transactions')
          .set('Authorization', `Bearer ${token}`)
      );
      
      const responses = await Promise.all(promises);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
```

## ⚡ Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
  it('should respond to transaction queries within acceptable time', async () => {
    const authToken = await getValidAuthToken(app);
    
    const startTime = Date.now();
    
    await request(app.getHttpServer())
      .get('/bank/transactions?page=1&limit=50')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(500);
  });
});
```

## 📊 Coverage Requirements

### Coverage Configuration

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    './src/modules/transaction/': {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json'],
};
```

## 🎯 Testing Best Practices

### Banking-Specific Guidelines

1. **Financial Precision Testing** - Always test with Decimal.js
2. **Security Testing** - Test for vulnerabilities in every feature
3. **Compliance Testing** - Verify regulatory requirements
4. **Error Handling** - Test all error scenarios thoroughly
5. **Performance Testing** - Ensure acceptable response times

### Test Organization

```
test/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/
│   ├── database/
│   └── api/
├── e2e/
│   ├── workflows/
│   └── security/
└── fixtures/
    ├── users.json
    └── transactions.json
```

This comprehensive testing guide ensures the Bank Server maintains the highest standards of quality, security, and compliance required for banking applications.
