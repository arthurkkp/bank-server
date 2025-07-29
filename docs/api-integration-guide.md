# Bank Server API Integration Guide

## Overview
This guide provides step-by-step instructions for integrating with the Bank Server API, including authentication, account management, and transaction processing.

## Base URL
- Development: `http://localhost:4000`
- Production: `https://api.pietrzakadrian.com`

## Authentication Flow

### 1. User Registration
```bash
curl -X POST http://localhost:4000/bank/Auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "avatar": "default-avatar.png"
}
```

### 2. User Login
```bash
curl -X POST http://localhost:4000/bank/Auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "pinCode": 12345,
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "user": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "avatar": "default-avatar.png"
  },
  "token": {
    "expiresIn": 3600,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Using the Access Token
Include the JWT token in the Authorization header for all authenticated requests:
```bash
curl -X GET http://localhost:4000/bank/Bills \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Account Management

### Creating a New Account
```bash
curl -X POST http://localhost:4000/bank/Bills \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD"
  }'
```

Response:
```json
{
  "uuid": "456e7890-e89b-12d3-a456-426614174001",
  "accountBillNumber": "12345",
  "amountMoney": "0.00",
  "currency": {
    "uuid": "789e0123-e89b-12d3-a456-426614174002",
    "name": "US Dollar",
    "code": "USD"
  }
}
```

### Getting Account Balance
```bash
curl -X GET http://localhost:4000/bank/Bills/amountMoney \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "totalAmountMoney": "1250.75"
}
```

### Getting User Accounts
```bash
curl -X GET http://localhost:4000/bank/Bills \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Transaction Processing

### Creating a Transaction
```bash
curl -X POST http://localhost:4000/bank/Transactions/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amountMoney": 150.50,
    "transferTitle": "Payment for services",
    "senderBill": "12345",
    "recipientBill": "67890",
    "locale": "en"
  }'
```

Response:
```json
{
  "uuid": "abc12345-e89b-12d3-a456-426614174003"
}
```

### Getting Authorization Key
```bash
curl -X GET http://localhost:4000/bank/Transactions/abc12345-e89b-12d3-a456-426614174003/authorizationKey \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "authorizationKey": "ABC123"
}
```

### Confirming a Transaction
```bash
curl -X PATCH http://localhost:4000/bank/Transactions/confirm \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "authorizationKey": "ABC123"
  }'
```

### Getting Transaction History
```bash
curl -X GET http://localhost:4000/bank/Transactions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## User Management

### Getting User Profile
```bash
curl -X GET http://localhost:4000/bank/Users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating User Profile
```bash
curl -X PATCH http://localhost:4000/bank/Users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Checking Email Availability
```bash
curl -X GET http://localhost:4000/bank/Users/john.doe@example.com/checkEmail
```

## Currency Management

### Getting Available Currencies
```bash
curl -X GET http://localhost:4000/bank/Currencies
```

Response:
```json
{
  "data": [
    {
      "uuid": "789e0123-e89b-12d3-a456-426614174002",
      "name": "US Dollar",
      "code": "USD"
    },
    {
      "uuid": "890e1234-e89b-12d3-a456-426614174003",
      "name": "Euro",
      "code": "EUR"
    }
  ],
  "meta": {
    "page": 1,
    "take": 10,
    "itemCount": 2,
    "pageCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

## Messages

### Getting Messages
```bash
curl -X GET http://localhost:4000/bank/Messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Creating a Message (Admin only)
```bash
curl -X POST http://localhost:4000/bank/Messages \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "content": "Scheduled maintenance on Sunday"
  }'
```

### Marking Message as Read
```bash
curl -X PATCH http://localhost:4000/bank/Messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "message-uuid-here"
  }'
```

## Error Handling
The API returns standard HTTP status codes:
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid or missing token)
- 404: Not Found
- 409: Conflict (e.g., email already exists)
- 500: Internal Server Error

Example error response:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Rate Limiting
The API implements rate limiting of 200 requests per 15-minute window per IP address.

## Security Considerations
- Always use HTTPS in production
- Store JWT tokens securely
- Implement proper token refresh mechanisms
- Never expose sensitive data in logs
- Validate all input data on the client side as well

## Testing with Postman
1. Import the Swagger JSON from `/documentation-json`
2. Set up environment variables for base URL and token
3. Use the pre-request scripts to automatically include the Bearer token
4. Test all endpoints systematically

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class BankAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createTransaction(transactionData) {
    const response = await this.client.post('/bank/Transactions/create', transactionData);
    return response.data;
  }

  async confirmTransaction(authorizationKey) {
    await this.client.patch('/bank/Transactions/confirm', { authorizationKey });
  }

  async getBalance() {
    const response = await this.client.get('/bank/Bills/amountMoney');
    return response.data;
  }
}

// Usage
const api = new BankAPI('http://localhost:4000', 'your-jwt-token');
const transaction = await api.createTransaction({
  amountMoney: 100,
  transferTitle: 'Test payment',
  senderBill: '12345',
  recipientBill: '67890',
  locale: 'en'
});
```

### Python
```python
import requests

class BankAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_transaction(self, transaction_data):
        response = requests.post(
            f'{self.base_url}/bank/Transactions/create',
            json=transaction_data,
            headers=self.headers
        )
        return response.json()
    
    def confirm_transaction(self, authorization_key):
        requests.patch(
            f'{self.base_url}/bank/Transactions/confirm',
            json={'authorizationKey': authorization_key},
            headers=self.headers
        )
    
    def get_balance(self):
        response = requests.get(
            f'{self.base_url}/bank/Bills/amountMoney',
            headers=self.headers
        )
        return response.json()

# Usage
api = BankAPI('http://localhost:4000', 'your-jwt-token')
transaction = api.create_transaction({
    'amountMoney': 100,
    'transferTitle': 'Test payment',
    'senderBill': '12345',
    'recipientBill': '67890',
    'locale': 'en'
})
```
