# Banking API Integration Guide

## Overview

This comprehensive guide helps developers integrate with the Banking API, a secure financial platform supporting double-entry bookkeeping, multi-currency operations, and enterprise-grade security.

## Base URLs

- **Production**: `https://api.pietrzakadrian.com`
- **Development**: `http://localhost:3000`

## Authentication

### JWT Token Authentication

The Banking API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

#### Login Flow

1. **Authenticate User**
   ```http
   POST /bank/auth/login
   Content-Type: application/json

   {
     "pinCode": 123456,
     "password": "SecurePassword123!"
   }
   ```

2. **Response**
   ```json
   {
     "user": {
       "uuid": "123e4567-e89b-12d3-a456-426614174000",
       "firstName": "John",
       "lastName": "Doe",
       "email": "john.doe@example.com"
     },
     "token": {
       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "expiresIn": 3600
     }
   }
   ```

3. **Use Token in Subsequent Requests**
   ```http
   GET /bank/users/
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Token Management

- **Token Expiration**: 1 hour (3600 seconds)
- **Refresh Strategy**: Re-authenticate when token expires
- **Storage**: Store securely (avoid localStorage for sensitive apps)

## Core Banking Operations

### 1. Account Management

#### Get User Accounts
```javascript
const getAccounts = async (token) => {
  const response = await fetch('/bank/bills/', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Create New Account
```javascript
const createAccount = async (token, currencyUuid) => {
  const response = await fetch('/bank/bills/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currencyUuid: currencyUuid
    })
  });
  return response.json();
};
```

### 2. Money Transfers

#### Create Transfer
```javascript
const createTransfer = async (token, transferData) => {
  const response = await fetch('/bank/transactions/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amountMoney: 100.50,
      transferTitle: "Payment for services",
      senderBill: "12345678901234567890123456",
      recipientBill: "98765432109876543210987654",
      locale: "en"
    })
  });
  return response.json();
};
```

#### Confirm Transfer
```javascript
const confirmTransfer = async (token, transactionUuid, authKey) => {
  const response = await fetch('/bank/transactions/confirm', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transactionUuid: transactionUuid,
      authorizationKey: authKey
    })
  });
  return response.status === 204;
};
```

## Frontend Integration Examples

### React/TypeScript Example

```typescript
import axios, { AxiosResponse } from 'axios';

interface LoginCredentials {
  pinCode: number;
  password: string;
}

interface AuthResponse {
  user: User;
  token: {
    accessToken: string;
    expiresIn: number;
  };
}

class BankingAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${this.baseURL}/bank/auth/login`,
      credentials
    );
    
    this.token = response.data.token.accessToken;
    return response.data;
  }

  async getAccounts() {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${this.baseURL}/bank/bills/`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    
    return response.data;
  }

  async createTransfer(transferData: CreateTransferRequest) {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.post(
      `${this.baseURL}/bank/transactions/create`,
      transferData,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    
    return response.data;
  }
}

// Usage
const client = new BankingAPIClient('https://api.pietrzakadrian.com');

const handleLogin = async () => {
  try {
    const auth = await client.login({
      pinCode: 123456,
      password: 'SecurePassword123!'
    });
    console.log('Logged in:', auth.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Vue.js Example

```javascript
// composables/useBankingAPI.js
import { ref, computed } from 'vue';

export function useBankingAPI() {
  const token = ref(localStorage.getItem('bankToken'));
  const user = ref(null);
  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials) => {
    try {
      const response = await fetch('/bank/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      token.value = data.token.accessToken;
      user.value = data.user;
      localStorage.setItem('bankToken', token.value);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    token,
    user,
    isAuthenticated,
    login,
    apiCall
  };
}
```

## Error Handling

### Banking-Specific Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `error.amount_money_not_enough` | Insufficient funds | 400 |
| `error.account_bill_number_generation_incorrect` | Invalid account number | 400 |
| `error.attempt_make_transfer_to_myself` | Self-transfer not allowed | 400 |
| `error.authorization_key_generation_incorrect` | Invalid authorization key | 400 |
| `error.email_address_exist` | Email already registered | 400 |
| `error.foreign_exchange_rates_not_found` | Currency rate unavailable | 400 |

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

### Error Handling Best Practices

```javascript
const handleAPIError = (error) => {
  if (error.response) {
    const { statusCode, message } = error.response.data;
    
    switch (message) {
      case 'error.amount_money_not_enough':
        return 'Insufficient funds for this transaction';
      case 'error.account_bill_number_generation_incorrect':
        return 'Invalid account number provided';
      case 'error.attempt_make_transfer_to_myself':
        return 'Cannot transfer money to the same account';
      default:
        return 'An unexpected error occurred';
    }
  }
  
  return 'Network error occurred';
};
```

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Check `X-RateLimit-*` headers in responses
- **Handling**: Implement exponential backoff for rate limit errors

```javascript
const apiCallWithRetry = async (url, options, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
};
```

## Security Best Practices

### 1. Token Security
- Store JWT tokens securely (httpOnly cookies for web apps)
- Implement token refresh mechanism
- Clear tokens on logout

### 2. HTTPS Only
- Always use HTTPS in production
- Validate SSL certificates

### 3. Input Validation
- Validate all user inputs client-side
- Server performs additional validation
- Sanitize data before API calls

### 4. Error Information
- Don't expose sensitive information in error messages
- Log errors securely on your backend

## Testing

### Postman Collection

```json
{
  "info": {
    "name": "Banking API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{authToken}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"pinCode\": 123456,\n  \"password\": \"SecurePassword123!\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/bank/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["bank", "auth", "login"]
        }
      }
    }
  ]
}
```

### Test Environment Setup

```bash
# Environment Variables
BANK_API_BASE_URL=http://localhost:3000
BANK_API_TEST_PIN=123456
BANK_API_TEST_PASSWORD=TestPassword123!
```

## SDKs and Libraries

### Node.js SDK Example

```javascript
// banking-api-sdk.js
class BankingAPISDK {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.timeout = options.timeout || 10000;
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new BankingAPIError(error.message, error.statusCode, error);
    }

    return response.json();
  }

  async authenticate(pinCode, password) {
    const result = await this.request('/bank/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pinCode, password })
    });

    this.token = result.token.accessToken;
    return result;
  }

  async getAccounts(page = 1, take = 10) {
    return this.request(`/bank/bills/?page=${page}&take=${take}`);
  }

  async createTransfer(transferData) {
    return this.request('/bank/transactions/create', {
      method: 'POST',
      body: JSON.stringify(transferData)
    });
  }
}

class BankingAPIError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = { BankingAPISDK, BankingAPIError };
```

## Support and Resources

- **API Documentation**: `/documentation` (Swagger UI)
- **Status Page**: Check API status and uptime
- **Rate Limits**: Monitor usage in response headers
- **Support**: Contact technical support for integration assistance

## Changelog

### Version 2.0.0
- Enhanced Swagger documentation
- Improved error response format
- Added comprehensive examples
- Updated authentication flow
- Added rate limiting documentation
