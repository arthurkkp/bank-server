# Banking API Security Documentation

## Overview

The Banking API implements enterprise-grade security measures to protect financial data and ensure secure transactions. This document outlines the security architecture, authentication mechanisms, and best practices.

## Authentication & Authorization

### JWT Token Authentication

The API uses JSON Web Tokens (JWT) for stateless authentication with the following characteristics:

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Token Expiration**: 1 hour (3600 seconds)
- **Token Location**: Authorization header with Bearer scheme
- **Payload**: Contains user UUID and role information

#### Token Structure
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "role": "user",
  "iat": 1753786843,
  "exp": 1753790443
}
```

#### Authentication Flow
1. User provides PIN code and password
2. Server validates credentials against hashed password
3. Server generates JWT token with user information
4. Client includes token in subsequent requests
5. Server validates token on each protected endpoint

### Role-Based Access Control (RBAC)

The API implements three user roles with different permission levels:

| Role | Permissions | Description |
|------|-------------|-------------|
| `USER` | Basic banking operations | Standard customer access |
| `ADMIN` | User management + banking operations | Administrative access |
| `ROOT` | Full system access | System administrator |

### Password Security

- **Hashing Algorithm**: bcrypt with salt rounds
- **Minimum Requirements**: 8 characters (enforced client-side)
- **PIN Code**: 6-digit numeric code for additional security
- **Password Reset**: Secure token-based reset via email

## Rate Limiting

### Request Limits
- **Rate**: 100 requests per 15 minutes per IP address
- **Headers**: Standard rate limit headers included in responses
- **Enforcement**: Express rate limiter middleware

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1753787743
```

### Rate Limit Response
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later",
  "error": "Too Many Requests"
}
```

## HTTPS & Transport Security

### TLS Configuration
- **Minimum Version**: TLS 1.2
- **Cipher Suites**: Strong encryption only
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate**: Valid SSL/TLS certificate required

### Security Headers

The API implements comprehensive security headers via Helmet.js:

```http
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## CORS (Cross-Origin Resource Sharing)

### Configuration
- **Allowed Origins**: Configurable via `CORS_ORIGIN` environment variable
- **Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Supported for authenticated requests

### CORS Headers
```http
Access-Control-Allow-Origin: https://bank.pietrzakadrian.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Input Validation & Sanitization

### Validation Pipeline
1. **DTO Validation**: Class-validator decorators on all input DTOs
2. **Type Checking**: TypeScript compile-time type safety
3. **Runtime Validation**: NestJS ValidationPipe with transformation
4. **Sanitization**: Automatic data sanitization and transformation

### Banking-Specific Validations
- **Account Numbers**: 26-digit numeric validation
- **Money Amounts**: Positive numbers with minimum 0.01
- **PIN Codes**: 6-digit numeric range (100000-999999)
- **Email Addresses**: RFC-compliant email validation

## Error Handling & Information Disclosure

### Secure Error Responses
- **No Sensitive Data**: Error messages don't expose internal details
- **Consistent Format**: Standardized error response structure
- **Logging**: Detailed errors logged server-side only
- **User-Friendly**: Client receives actionable error messages

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "error.amount_money_not_enough",
  "error": "Bad Request",
  "timestamp": "2025-07-29T11:00:43.000Z",
  "path": "/bank/transactions/create"
}
```

## Database Security

### Connection Security
- **Encrypted Connections**: SSL/TLS for database connections
- **Connection Pooling**: Secure connection pool management
- **Credential Management**: Environment-based configuration

### Data Protection
- **Password Hashing**: bcrypt for all password storage
- **Sensitive Data**: PII encryption at rest
- **Audit Logging**: Transaction audit trails
- **Backup Encryption**: Encrypted database backups

## Transaction Security

### Double-Entry Bookkeeping
- **Atomic Transactions**: Database transactions ensure consistency
- **Balance Validation**: Real-time balance checks
- **Authorization Keys**: Additional security for transaction confirmation
- **Audit Trail**: Complete transaction history logging

### Transfer Security Flow
1. **Initial Validation**: Account existence and balance checks
2. **Transaction Creation**: Pending transaction with authorization key
3. **Two-Factor Confirmation**: Authorization key required for execution
4. **Atomic Execution**: Database transaction ensures consistency
5. **Audit Logging**: Complete transaction record created

## API Security Best Practices

### Client Implementation
```javascript
// Secure token storage (avoid localStorage for sensitive apps)
const secureStorage = {
  setToken: (token) => {
    // Use httpOnly cookies or secure storage
    document.cookie = `authToken=${token}; Secure; HttpOnly; SameSite=Strict`;
  },
  
  getToken: () => {
    // Retrieve from secure storage
    return getCookieValue('authToken');
  }
};

// Request interceptor for token management
const apiClient = axios.create({
  baseURL: 'https://api.pietrzakadrian.com',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = secureStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      secureStorage.clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Server-Side Security
- **Environment Variables**: Sensitive configuration via environment
- **Secret Management**: Secure secret rotation and management
- **Monitoring**: Real-time security monitoring and alerting
- **Penetration Testing**: Regular security assessments

## Compliance & Standards

### Financial Regulations
- **PCI DSS**: Payment Card Industry compliance considerations
- **GDPR**: General Data Protection Regulation compliance
- **SOX**: Sarbanes-Oxley financial reporting requirements
- **AML**: Anti-Money Laundering transaction monitoring

### Security Standards
- **OWASP Top 10**: Protection against common vulnerabilities
- **ISO 27001**: Information security management
- **NIST Framework**: Cybersecurity framework implementation
- **SOC 2**: Service organization control compliance

## Monitoring & Incident Response

### Security Monitoring
- **Failed Authentication**: Brute force attack detection
- **Rate Limiting**: Unusual request pattern monitoring
- **Transaction Anomalies**: Suspicious transaction detection
- **Error Patterns**: Security-related error monitoring

### Incident Response
1. **Detection**: Automated security monitoring alerts
2. **Assessment**: Security team evaluates threat level
3. **Containment**: Immediate threat mitigation measures
4. **Investigation**: Forensic analysis of security incident
5. **Recovery**: System restoration and security improvements
6. **Lessons Learned**: Post-incident security enhancements

## Security Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRATION_TIME=3600
JWT_FORGOTTEN_PASSWORD_TOKEN_SECRET=your-password-reset-secret
JWT_FORGOTTEN_PASSWORD_TOKEN_EXPIRATION_TIME=1800

# Database Security
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# CORS Configuration
CORS_ORIGIN=https://bank.pietrzakadrian.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Deployment
- **HTTPS Only**: Force HTTPS in production
- **Security Headers**: Comprehensive security header configuration
- **Firewall Rules**: Network-level access controls
- **DDoS Protection**: Distributed denial of service protection
- **WAF**: Web Application Firewall implementation

## Security Checklist

### Development
- [ ] All endpoints require authentication where appropriate
- [ ] Input validation on all user inputs
- [ ] Secure password hashing implementation
- [ ] Rate limiting configured and tested
- [ ] Error handling doesn't expose sensitive information
- [ ] HTTPS enforced in production

### Deployment
- [ ] Environment variables configured securely
- [ ] Database connections encrypted
- [ ] Security headers implemented
- [ ] CORS properly configured
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested

### Ongoing
- [ ] Regular security assessments
- [ ] Dependency vulnerability scanning
- [ ] Security monitoring and incident response
- [ ] Staff security training
- [ ] Compliance audits and reviews
- [ ] Security documentation updates
