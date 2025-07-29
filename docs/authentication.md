# Authentication Documentation

## Overview
The Bank Server API uses JWT (JSON Web Token) based authentication with Bearer token authorization.

## Authentication Flow

### 1. User Registration
New users must register with email, password, and personal information. Upon registration, a unique PIN code is automatically generated.

**Endpoint:** `POST /bank/Auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "avatar": "default-avatar.png"
}
```

**Important Notes:**
- PIN code is automatically generated and sent via email
- Password must be at least 6 characters long
- Email must be unique across the system
- User receives a welcome email with their PIN code

### 2. Login Process
Users authenticate using their PIN code and password. Successful authentication returns a JWT token.

**Endpoint:** `POST /bank/Auth/login`

**Request Body:**
```json
{
  "pinCode": 12345,
  "password": "SecurePassword123!"
}
```

**Response:**
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

### 3. Token Usage
Include the JWT token in the Authorization header for all authenticated requests:

```
Authorization: Bearer <your-jwt-token>
```

**Example:**
```bash
curl -X GET http://localhost:4000/bank/Users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Token Structure
```json
{
  "expiresIn": 3600,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **expiresIn**: Token expiration time in seconds (default: 3600 = 1 hour)
- **accessToken**: JWT token string for API authentication

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Minimum password length: 6 characters
- Passwords are never stored in plain text
- Password reset functionality available via email

### PIN Code System
- Unique numeric identifiers (1-99999)
- Automatically generated during registration
- Sent securely via email
- Used as primary authentication identifier

### JWT Token Security
- Tokens expire after 1 hour for security
- Signed using HS256 algorithm
- Contains user information and permissions
- Stateless authentication mechanism

### Rate Limiting
- 200 requests per 15-minute window per IP address
- Prevents brute force attacks
- Applies to all API endpoints

### Additional Security Measures
- CORS protection enabled
- Helmet middleware for security headers
- Request validation and sanitization
- SQL injection prevention via TypeORM

## Role-Based Access Control
The API supports three user roles with different permission levels:

### USER Role
- Standard banking operations
- Account management
- Transaction processing
- Profile management

**Accessible Endpoints:**
- All Auth endpoints
- All Bills endpoints
- All Transactions endpoints
- User profile endpoints
- Messages (read only)

### ADMIN Role
- All USER permissions
- Message management
- User administration
- System monitoring

**Additional Accessible Endpoints:**
- Message creation and management
- User management operations
- Administrative reports

### ROOT Role
- All ADMIN permissions
- Full system access
- Configuration management
- System administration

**Additional Accessible Endpoints:**
- System configuration
- Database management
- Full administrative access

## Password Reset Flow

### 1. Request Password Reset
**Endpoint:** `POST /bank/Auth/password/forget`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:** `204 No Content` (for security, always returns success)

### 2. Reset Password
**Endpoint:** `PATCH /bank/Auth/password/reset`

**Headers:**
```
Authorization: Bearer <reset-token-from-email>
```

**Request Body:**
```json
{
  "password": "NewSecurePassword123!"
}
```

**Response:** `204 No Content`

## Logout Process
**Endpoint:** `PATCH /bank/Auth/logout`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:** `204 No Content`

**Note:** Updates the user's last logout timestamp for audit purposes.

## Error Responses

### Authentication Errors
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Validation Errors
```json
{
  "statusCode": 400,
  "message": ["pinCode must be a number", "password should not be empty"],
  "error": "Bad Request"
}
```

### Rate Limit Exceeded
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Rate Limit Exceeded"
}
```

## Best Practices

### For Developers
1. **Store tokens securely** - Use secure storage mechanisms
2. **Implement token refresh** - Handle token expiration gracefully
3. **Validate on client side** - Implement client-side validation
4. **Handle errors properly** - Implement proper error handling
5. **Use HTTPS** - Always use HTTPS in production

### For Users
1. **Strong passwords** - Use complex passwords with mixed characters
2. **Secure PIN storage** - Keep PIN codes confidential
3. **Regular logout** - Log out when finished using the application
4. **Monitor activity** - Check account activity regularly

## Integration Examples

### JavaScript/Node.js
```javascript
class AuthService {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  async login(pinCode, password) {
    const response = await fetch(`${this.baseURL}/bank/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinCode, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      this.token = data.token.accessToken;
      localStorage.setItem('authToken', this.token);
      return data;
    }
    throw new Error('Login failed');
  }

  async logout() {
    await fetch(`${this.baseURL}/bank/Auth/logout`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}
```

### Python
```python
import requests
import json

class AuthService:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
    
    def login(self, pin_code, password):
        response = requests.post(
            f'{self.base_url}/bank/Auth/login',
            json={'pinCode': pin_code, 'password': password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']['accessToken']
            return data
        else:
            raise Exception('Login failed')
    
    def logout(self):
        if self.token:
            requests.patch(
                f'{self.base_url}/bank/Auth/logout',
                headers={'Authorization': f'Bearer {self.token}'}
            )
            self.token = None
    
    def get_auth_headers(self):
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
```

## Troubleshooting

### Common Issues

1. **Token Expired**
   - Error: 401 Unauthorized
   - Solution: Re-authenticate to get a new token

2. **Invalid PIN/Password**
   - Error: 401 Unauthorized
   - Solution: Verify credentials or use password reset

3. **Rate Limit Exceeded**
   - Error: 429 Too Many Requests
   - Solution: Wait 15 minutes or implement exponential backoff

4. **Email Already Exists**
   - Error: 409 Conflict
   - Solution: Use a different email or login with existing account

### Debug Tips
1. Check token expiration time
2. Verify Authorization header format
3. Ensure proper Content-Type headers
4. Validate request body structure
5. Check network connectivity and CORS settings
