# Debugging Guide - Bank Server

This comprehensive guide provides debugging strategies, tools, and procedures specifically tailored for the Bank Server backend application with emphasis on banking-specific scenarios and security considerations.

## 📋 Table of Contents

- [Debugging Philosophy](#debugging-philosophy)
- [Development Environment Debugging](#development-environment-debugging)
- [Banking-Specific Debugging](#banking-specific-debugging)
- [Security Debugging](#security-debugging)
- [Performance Debugging](#performance-debugging)
- [Database Debugging](#database-debugging)
- [API Debugging](#api-debugging)
- [Production Debugging](#production-debugging)
- [Debugging Tools](#debugging-tools)
- [Common Issues and Solutions](#common-issues-and-solutions)

## 🎯 Debugging Philosophy

### Banking Application Debugging Principles

1. **Security First** - Never expose sensitive data during debugging
2. **Audit Trail** - All debugging activities must be logged
3. **Data Integrity** - Ensure debugging doesn't compromise financial data
4. **Compliance** - Maintain regulatory compliance during debugging
5. **Minimal Impact** - Debug without affecting production operations

### Debugging Mindset

- **Systematic Approach** - Follow structured debugging methodology
- **Hypothesis-Driven** - Form and test specific hypotheses
- **Documentation** - Document findings and solutions
- **Prevention** - Identify root causes to prevent recurrence

## 🛠 Development Environment Debugging

### Setting Up Debug Environment

#### VS Code Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "args": [],
      "runtimeArgs": [
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "sourceMaps": true,
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### Debug Scripts
```json
{
  "scripts": {
    "start:debug": "nest start --debug --watch",
    "start:debug:brk": "nest start --debug 0.0.0.0:9229 --watch",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

## 🏦 Banking-Specific Debugging

### Transaction Processing Debugging

#### Transaction Flow Debugging
```typescript
@Injectable()
export class TransactionDebugService {
  private readonly logger = new Logger(TransactionDebugService.name);

  async debugTransactionFlow(transactionId: string): Promise<TransactionDebugInfo> {
    this.logger.debug(`Starting transaction flow debug for: ${transactionId}`);

    const transaction = await this.getTransactionDetails(transactionId);
    const validationResults = await this.debugValidation(transaction);
    const balanceChecks = await this.debugBalanceChecks(transaction);
    const auditTrail = await this.getAuditTrail(transactionId);

    return {
      transaction,
      validationResults,
      balanceChecks,
      auditTrail,
      recommendations: this.generateRecommendations(validationResults, balanceChecks),
    };
  }

  private validateAmount(amount: string): AmountValidationResult {
    try {
      const decimal = new Decimal(amount);
      return {
        valid: decimal.gt(0) && decimal.dp() <= 2,
        value: decimal.toString(),
        precision: decimal.dp(),
        issues: this.getAmountIssues(decimal),
      };
    } catch (error) {
      return {
        valid: false,
        value: amount,
        error: error.message,
        issues: ['INVALID_FORMAT'],
      };
    }
  }
}
```

### Currency Conversion Debugging

```typescript
@Injectable()
export class CurrencyDebugService {
  async debugCurrencyConversion(
    amount: string,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<CurrencyDebugInfo> {
    this.logger.debug(`Debugging currency conversion: ${amount} ${fromCurrency} -> ${toCurrency}`);

    const conversionSteps = [];
    
    // Step 1: Validate input
    conversionSteps.push({
      step: 'INPUT_VALIDATION',
      input: { amount, fromCurrency, toCurrency },
      result: this.validateCurrencyInput(amount, fromCurrency, toCurrency),
    });

    // Step 2: Get exchange rate
    const exchangeRateInfo = await this.debugExchangeRate(fromCurrency, toCurrency);
    conversionSteps.push({
      step: 'EXCHANGE_RATE_FETCH',
      result: exchangeRateInfo,
    });

    return {
      steps: conversionSteps,
      summary: this.generateConversionSummary(conversionSteps),
      recommendations: this.generateConversionRecommendations(conversionSteps),
    };
  }
}
```

## 🔒 Security Debugging

### Authentication Debugging

```typescript
@Injectable()
export class AuthDebugService {
  async debugAuthentication(token: string): Promise<AuthDebugInfo> {
    this.logger.debug('Debugging authentication token');

    const tokenAnalysis = this.analyzeToken(token);
    const validationResults = await this.validateToken(token);
    const userContext = await this.getUserContext(validationResults.payload);

    return {
      tokenAnalysis,
      validationResults,
      userContext,
      securityChecks: await this.performSecurityChecks(token, userContext),
      recommendations: this.generateAuthRecommendations(tokenAnalysis, validationResults),
    };
  }

  private analyzeToken(token: string): TokenAnalysis {
    try {
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return {
          valid: false,
          error: 'Invalid JWT format - expected 3 parts',
          parts: parts.length,
        };
      }

      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      return {
        valid: true,
        header,
        payload,
        signature: parts[2],
        algorithm: header.alg,
        tokenType: header.typ,
        expirationTime: new Date(payload.exp * 1000),
        isExpired: Date.now() > payload.exp * 1000,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Token parsing failed: ${error.message}`,
      };
    }
  }
}
```

## ⚡ Performance Debugging

### Database Performance Debugging

```typescript
@Injectable()
export class DatabaseDebugService {
  async debugSlowQuery(queryId: string): Promise<QueryDebugInfo> {
    this.logger.debug(`Debugging slow query: ${queryId}`);

    const queryInfo = await this.getQueryInfo(queryId);
    const executionPlan = await this.getExecutionPlan(queryInfo.sql);
    const indexAnalysis = await this.analyzeIndexUsage(queryInfo.sql);

    return {
      queryInfo,
      executionPlan,
      indexAnalysis,
      recommendations: this.generatePerformanceRecommendations(executionPlan, indexAnalysis),
    };
  }

  private async getExecutionPlan(sql: string): Promise<ExecutionPlan> {
    const explainResult = await this.dataSource.query(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`);
    
    return {
      rawPlan: explainResult,
      totalCost: this.extractTotalCost(explainResult),
      executionTime: this.extractExecutionTime(explainResult),
      rowsProcessed: this.extractRowsProcessed(explainResult),
      bottlenecks: this.identifyBottlenecks(explainResult),
    };
  }
}
```

## 🔧 Debugging Tools

### Custom Debug Middleware

```typescript
@Injectable()
export class DebugMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebugMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    const requestId = uuidv4();
    req['requestId'] = requestId;

    const startTime = Date.now();
    
    this.logger.debug(`[${requestId}] ${req.method} ${req.url}`, {
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      body: this.sanitizeBody(req.body),
    });

    next();
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.accountNumber;
    return sanitized;
  }
}
```

## 🚨 Common Issues and Solutions

### Banking-Specific Issues

#### Transaction Processing Issues

**Issue**: Transaction amounts losing precision
```typescript
// Problem: Using JavaScript numbers
const amount = 0.1 + 0.2; // 0.30000000000000004

// Solution: Use Decimal.js
import { Decimal } from 'decimal.js';
const amount = new Decimal('0.1').plus(new Decimal('0.2')); // 0.3
```

**Issue**: Race conditions in concurrent transactions
```typescript
// Solution: Use database transactions with locking
async processTransaction(transactionData) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const account = await queryRunner.manager
      .createQueryBuilder(Account, 'account')
      .setLock('pessimistic_write')
      .where('account.id = :id', { id: transactionData.accountId })
      .getOne();

    const newBalance = new Decimal(account.balance).minus(transactionData.amount);
    await queryRunner.manager.update(Account, transactionData.accountId, {
      balance: newBalance.toString(),
    });

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Security Issues

**Issue**: JWT token not properly validated
```typescript
// Problem: Trusting token without verification
const payload = jwt.decode(token); // Dangerous!

// Solution: Always verify signature
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return payload;
} catch (error) {
  throw new UnauthorizedException('Invalid token');
}
```

**Issue**: Sensitive data in logs
```typescript
// Problem: Logging sensitive information
this.logger.log('Processing transaction', { 
  accountNumber: transaction.accountNumber, // Sensitive!
});

// Solution: Sanitize logs
this.logger.log('Processing transaction', {
  accountNumber: this.maskAccountNumber(transaction.accountNumber),
});

private maskAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/\d(?=\d{4})/g, '*');
}
```

### Performance Issues

**Issue**: N+1 query problem
```typescript
// Problem: Loading related data in loop
const transactions = await this.transactionRepository.find();
for (const transaction of transactions) {
  transaction.user = await this.userRepository.findOne(transaction.userId);
}

// Solution: Use eager loading
const transactions = await this.transactionRepository.find({
  relations: ['user', 'senderAccount', 'recipientAccount'],
});
```

This comprehensive debugging guide provides the tools and methodologies needed to effectively debug banking applications while maintaining security and compliance standards.
