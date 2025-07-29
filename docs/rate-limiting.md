# Rate Limiting Documentation

## Overview

The Banking API implements rate limiting to protect against abuse, ensure fair usage, and maintain system stability. This document details the rate limiting implementation, monitoring, and best practices.

## Rate Limiting Configuration

### Current Limits
- **Window**: 15 minutes (900,000 milliseconds)
- **Maximum Requests**: 100 requests per IP address per window
- **Reset**: Rolling window (resets continuously)
- **Scope**: Per IP address

### Implementation
The API uses Express Rate Limit middleware with the following configuration:

```javascript
app.use(
  RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      statusCode: 429,
      message: 'Too many requests from this IP, please try again later',
      error: 'Too Many Requests'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
```

## Rate Limit Headers

### Standard Headers
The API includes standard rate limiting headers in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1753787743
```

### Header Descriptions
- **X-RateLimit-Limit**: Maximum number of requests allowed in the time window
- **X-RateLimit-Remaining**: Number of requests remaining in the current window
- **X-RateLimit-Reset**: Unix timestamp when the rate limit window resets

## Rate Limit Response

### HTTP 429 Response
When rate limit is exceeded, the API returns:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1753787743
Retry-After: 300

{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later",
  "error": "Too Many Requests"
}
```

## Client Implementation

### Handling Rate Limits

#### JavaScript/TypeScript Example
```javascript
class BankingAPIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { endpoint, options, resolve, reject } = this.requestQueue.shift();

      try {
        const response = await this.executeRequest(endpoint, options);
        resolve(response);
      } catch (error) {
        if (error.status === 429) {
          // Rate limited - add back to queue and wait
          this.requestQueue.unshift({ endpoint, options, resolve, reject });
          const retryAfter = error.headers.get('Retry-After') || 300;
          await this.delay(retryAfter * 1000);
          continue;
        }
        reject(error);
      }

      // Small delay between requests to avoid hitting limits
      await this.delay(100);
    }

    this.isProcessingQueue = false;
  }

  async executeRequest(endpoint, options) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.headers = response.headers;
      throw error;
    }

    return response.json();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### Python Example
```python
import time
import requests
from typing import Dict, Any

class BankingAPIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
    
    def make_request(self, endpoint: str, method: str = 'GET', 
                    data: Dict[Any, Any] = None, max_retries: int = 3) -> Dict[Any, Any]:
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(max_retries):
            try:
                response = self.session.request(method, url, json=data)
                
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 300))
                    print(f"Rate limited. Waiting {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retries exceeded")
```

### Best Practices for Clients

#### 1. Respect Rate Limits
```javascript
// Check rate limit headers before making requests
const checkRateLimit = (response) => {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const reset = parseInt(response.headers.get('X-RateLimit-Reset'));
  
  if (remaining < 10) {
    const waitTime = (reset * 1000) - Date.now();
    console.warn(`Approaching rate limit. ${remaining} requests remaining.`);
    
    if (waitTime > 0) {
      console.warn(`Rate limit resets in ${Math.ceil(waitTime / 1000)} seconds`);
    }
  }
};
```

#### 2. Implement Exponential Backoff
```javascript
const exponentialBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000); // Max 30 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

#### 3. Request Batching
```javascript
// Batch multiple operations to reduce request count
const batchOperations = async (operations) => {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(op => exponentialBackoff(() => op()))
    );
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < operations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};
```

## Monitoring and Analytics

### Rate Limit Metrics
Monitor the following metrics to understand API usage patterns:

- **Requests per minute/hour/day**
- **Rate limit violations per IP**
- **Top consuming IP addresses**
- **Request patterns by endpoint**
- **Geographic distribution of requests**

### Alerting
Set up alerts for:
- High rate limit violation rates
- Unusual traffic spikes
- Potential DDoS attacks
- API abuse patterns

## Rate Limit Bypass (Internal Use)

### Whitelisted IPs
For internal services or trusted partners, consider implementing IP whitelisting:

```javascript
const whitelist = ['192.168.1.0/24', '10.0.0.0/8'];

const rateLimitWithWhitelist = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => {
    const clientIP = req.ip;
    return whitelist.some(range => ipInRange(clientIP, range));
  }
});
```

### API Keys with Higher Limits
Implement tiered rate limiting based on API key types:

```javascript
const getTierLimits = (apiKey) => {
  const tier = getAPIKeyTier(apiKey);
  
  switch (tier) {
    case 'premium':
      return { windowMs: 15 * 60 * 1000, max: 1000 };
    case 'standard':
      return { windowMs: 15 * 60 * 1000, max: 500 };
    default:
      return { windowMs: 15 * 60 * 1000, max: 100 };
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Legitimate Users Hit Limits
**Symptoms**: Users report 429 errors during normal usage
**Solutions**:
- Review rate limit thresholds
- Implement user-based rate limiting instead of IP-based
- Provide clear error messages with retry guidance

#### 2. Shared IP Addresses
**Symptoms**: Multiple users from same network (corporate, NAT) hit limits
**Solutions**:
- Implement authenticated user rate limiting
- Higher limits for authenticated requests
- Consider user + IP combination for rate limiting

#### 3. Bot Traffic
**Symptoms**: Consistent rate limit violations from specific IPs
**Solutions**:
- Implement CAPTCHA for repeated violations
- Block or heavily rate limit suspicious IPs
- Use bot detection services

### Debugging Rate Limits

#### Check Current Status
```bash
# Check rate limit headers
curl -I https://api.pietrzakadrian.com/bank/users/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response headers will show:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1753787743
```

#### Monitor Rate Limit Usage
```javascript
// Client-side rate limit monitoring
const monitorRateLimit = (response) => {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  console.log(`Rate Limit: ${remaining}/${limit} remaining`);
  console.log(`Resets at: ${new Date(reset * 1000).toISOString()}`);
  
  // Store for client-side rate limiting
  localStorage.setItem('rateLimitStatus', JSON.stringify({
    limit: parseInt(limit),
    remaining: parseInt(remaining),
    reset: parseInt(reset)
  }));
};
```

## Future Enhancements

### Planned Improvements
1. **User-based Rate Limiting**: Rate limits per authenticated user
2. **Endpoint-specific Limits**: Different limits for different endpoints
3. **Dynamic Rate Limiting**: Adjust limits based on system load
4. **Geographic Rate Limiting**: Different limits by region
5. **API Key Tiers**: Premium users with higher limits

### Configuration Options
Future versions may support:
- Redis-based distributed rate limiting
- Custom rate limit algorithms
- Real-time rate limit adjustment
- Advanced bot detection integration
