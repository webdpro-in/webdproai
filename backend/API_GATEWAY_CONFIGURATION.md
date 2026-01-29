# API Gateway Configuration - WebDPro Backend

**Date:** January 29, 2026  
**Task:** 4.1 Set up AWS API Gateway with HTTP API  
**Status:** ✅ Completed

---

## Overview

This document describes the API Gateway configuration for the WebDPro backend service. The configuration has been migrated from REST API (v1) to HTTP API (v2) with proper security controls, CORS whitelisting, JWT authentication, and rate limiting.

---

## Key Features

### 1. HTTP API (API Gateway V2)

**Why HTTP API instead of REST API?**
- 70% cheaper than REST API
- Lower latency (average 10-20ms faster)
- Simpler configuration
- Built-in CORS support
- Native JWT authorizer support

### 2. CORS Configuration (Requirement 7.3, 16.1)

**Whitelisted Origins:**
```yaml
allowedOrigins:
  - http://localhost:3000              # Local development
  - https://d3qhkomcxcxmtl.cloudfront.net  # CloudFront deployment
  - https://ai-gamma-rose.vercel.app   # Vercel deployment
  - ${env:FRONTEND_URL}                # Configurable via environment
```

**Allowed Headers:**
- `Content-Type` - JSON payloads
- `Authorization` - JWT tokens
- `X-Request-ID` - Correlation IDs
- `X-Amz-Date` - AWS signature
- `X-Api-Key` - API keys
- `X-Amz-Security-Token` - AWS credentials
- `X-Amz-User-Agent` - Client identification

**Allowed Methods:**
- `GET` - Read operations
- `POST` - Create operations
- `PUT` - Update operations
- `DELETE` - Delete operations
- `OPTIONS` - Preflight requests

**Configuration:**
- `maxAge: 3600` - Cache preflight responses for 1 hour
- `allowCredentials: true` - Support cookies and authentication

**Security Benefits:**
- ✅ Prevents unauthorized domains from accessing the API
- ✅ Reduces CSRF attack surface
- ✅ Complies with browser security policies
- ✅ Allows legitimate frontend applications

### 3. JWT Authorizer (Requirement 7.4, 16.2)

**Configuration:**
```yaml
authorizers:
  cognitoAuthorizer:
    type: jwt
    identitySource: $request.header.Authorization
    issuerUrl: https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_RfO53Cz5t
    audience:
      - 7g6sqvvnqsg628napds0k73190
```

**How It Works:**
1. Client sends request with `Authorization: Bearer <JWT_TOKEN>` header
2. API Gateway validates JWT signature using Cognito public keys
3. API Gateway checks token expiration
4. API Gateway verifies audience matches Cognito Client ID
5. If valid, request is forwarded to Lambda with user context
6. If invalid, API Gateway returns 401 Unauthorized (Lambda not invoked)

**Security Benefits:**
- ✅ Authentication happens at gateway level (before Lambda)
- ✅ Reduces Lambda invocations for invalid tokens (cost savings)
- ✅ Prevents unauthorized access to protected endpoints
- ✅ Automatic token validation (no custom code needed)
- ✅ User context available in Lambda event

**Protected Endpoints:**
All endpoints except authentication endpoints require JWT:
- `/auth/profile` - GET
- `/stores/*` - All methods
- `/orders/*` - All methods

**Public Endpoints:**
No authentication required:
- `/auth/otp/request` - POST
- `/auth/otp/verify` - POST
- `/auth/google/sync` - POST

### 4. Rate Limiting (Requirement 7.4, 16.3)

**Configuration:**
```yaml
throttle:
  burstLimit: 100    # Maximum concurrent requests
  rateLimit: 50      # Requests per second
```

**How It Works:**
- API Gateway tracks requests per second
- Allows burst of up to 100 concurrent requests
- Sustained rate limited to 50 requests/second
- Returns 429 Too Many Requests when exceeded
- Applies to all endpoints globally

**Security Benefits:**
- ✅ Prevents DDoS attacks
- ✅ Protects backend from overload
- ✅ Ensures fair resource allocation
- ✅ Reduces AWS costs during attacks

**Considerations:**
- Current limits are global (all users share the same quota)
- May need per-user rate limiting in future
- Adjust limits based on production traffic patterns

### 5. Access Logging (Requirement 16.5)

**Log Group:** `/aws/apigateway/webdpro-backend-${stage}`  
**Retention:** 7 days

**Logged Fields:**
```json
{
  "requestId": "abc-123-def",
  "ip": "192.168.1.1",
  "requestTime": "29/Jan/2026:10:30:00 +0000",
  "httpMethod": "POST",
  "routeKey": "POST /stores/generate",
  "status": 200,
  "protocol": "HTTP/1.1",
  "responseLength": 1234,
  "integrationLatency": 150,
  "responseLatency": 155,
  "authorizerError": null,
  "integrationError": null
}
```

**Use Cases:**
- Debug authentication issues (check `authorizerError`)
- Monitor API performance (check `integrationLatency`, `responseLatency`)
- Track error rates (filter by `status >= 400`)
- Identify slow endpoints (sort by `integrationLatency`)
- Audit API access (track `ip`, `requestTime`, `httpMethod`)

**CloudWatch Insights Queries:**

**Error Rate:**
```
fields @timestamp, status, routeKey, integrationError
| filter status >= 400
| stats count() by status, routeKey
```

**Latency Analysis:**
```
fields @timestamp, routeKey, integrationLatency, responseLatency
| stats avg(integrationLatency), max(integrationLatency), avg(responseLatency), max(responseLatency) by routeKey
```

**Top Users by IP:**
```
fields @timestamp, ip, routeKey
| stats count() by ip
| sort count desc
| limit 10
```

---

## Endpoint Configuration

### Authentication Endpoints (Public)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/otp/request` | POST | ❌ No | Request OTP for phone login |
| `/auth/otp/verify` | POST | ❌ No | Verify OTP and get JWT token |
| `/auth/google/sync` | POST | ❌ No | Sync Google OAuth user |
| `/auth/profile` | GET | ✅ Yes | Get authenticated user profile |

### Store Endpoints (Protected)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/stores/generate` | POST | ✅ Yes | Generate new store |
| `/stores` | GET | ✅ Yes | List user's stores |
| `/stores/{storeId}` | GET | ✅ Yes | Get store details |
| `/stores/{storeId}` | PUT | ✅ Yes | Update store |
| `/stores/{storeId}/publish` | POST | ✅ Yes | Publish store to CloudFront |

### Domain Endpoints (Protected)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/stores/{storeId}/domain` | POST | ✅ Yes | Connect custom domain |
| `/stores/{storeId}/domain/status` | GET | ✅ Yes | Get domain connection status |
| `/stores/{storeId}/domain/verify` | POST | ✅ Yes | Verify domain ownership |

### Order Endpoints (Protected)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/stores/{storeId}/orders` | POST | ✅ Yes | Create new order |
| `/stores/{storeId}/orders` | GET | ✅ Yes | List store orders |
| `/orders/{orderId}` | GET | ✅ Yes | Get order details |
| `/orders/{orderId}/status` | PUT | ✅ Yes | Update order status |

---

## Deployment

### Prerequisites

1. **Cognito User Pool** must exist:
   - User Pool ID: `eu-north-1_RfO53Cz5t`
   - Client ID: `7g6sqvvnqsg628napds0k73190`
   - Domain: `webdpro-auth-dev-kb83.auth.eu-north-1.amazoncognito.com`

2. **Environment Variables** must be set:
   - `FRONTEND_URL` - Additional frontend origin (optional)

### Deploy Command

```bash
cd backend
npm install
serverless deploy --stage dev
```

### Verify Deployment

1. **Check API Gateway URL:**
   ```bash
   serverless info --stage dev
   ```
   Look for: `HttpApiUrl: https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com`

2. **Test CORS:**
   ```bash
   curl -X OPTIONS https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com/auth/otp/request \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   Should return CORS headers:
   ```
   Access-Control-Allow-Origin: http://localhost:3000
   Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
   Access-Control-Allow-Headers: Content-Type,Authorization,...
   ```

3. **Test Authentication:**
   ```bash
   # Without token (should return 401)
   curl https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com/stores \
     -H "Origin: http://localhost:3000"
   
   # With valid token (should return 200)
   curl https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com/stores \
     -H "Origin: http://localhost:3000" \
     -H "Authorization: Bearer <JWT_TOKEN>"
   ```

4. **Test Rate Limiting:**
   ```bash
   # Send 100+ requests rapidly
   for i in {1..150}; do
     curl https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com/auth/otp/request \
       -X POST \
       -H "Content-Type: application/json" \
       -d '{"phone": "+1234567890"}' &
   done
   wait
   ```
   Some requests should return 429 Too Many Requests.

5. **Check Access Logs:**
   ```bash
   aws logs tail /aws/apigateway/webdpro-backend-dev --follow
   ```

---

## Frontend Integration

### Update API URL

**Before (REST API):**
```typescript
const API_URL = 'https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev';
```

**After (HTTP API):**
```typescript
const API_URL = 'https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com';
// Note: No /dev stage in URL for HTTP API
```

### Update Request Headers

**Required Headers:**
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwtToken}`,  // For protected endpoints
  'X-Request-ID': generateCorrelationId(), // Optional but recommended
};
```

### Handle CORS Errors

**Common Issues:**

1. **Origin not whitelisted:**
   ```
   Error: CORS policy: No 'Access-Control-Allow-Origin' header
   ```
   **Solution:** Add origin to `allowedOrigins` in serverless.yml

2. **Missing Authorization header:**
   ```
   Error: 401 Unauthorized
   ```
   **Solution:** Include JWT token in Authorization header

3. **Rate limit exceeded:**
   ```
   Error: 429 Too Many Requests
   ```
   **Solution:** Implement exponential backoff retry logic

### Example API Client

```typescript
class WebDProAPIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': this.generateCorrelationId(),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public endpoints
  async requestOTP(phone: string) {
    return this.request('POST', '/auth/otp/request', { phone });
  }

  async verifyOTP(phone: string, code: string) {
    const response = await this.request('POST', '/auth/otp/verify', {
      phone,
      code,
    });
    this.setToken(response.data.token);
    return response;
  }

  // Protected endpoints
  async getStores() {
    return this.request('GET', '/stores');
  }

  async generateStore(data: any) {
    return this.request('POST', '/stores/generate', data);
  }

  async getStore(storeId: string) {
    return this.request('GET', `/stores/${storeId}`);
  }
}

// Usage
const client = new WebDProAPIClient('https://xxxxxxxxxx.execute-api.eu-north-1.amazonaws.com');

// Login
await client.requestOTP('+1234567890');
await client.verifyOTP('+1234567890', '123456');

// Access protected endpoints
const stores = await client.getStores();
```

---

## Security Considerations

### ✅ Implemented

1. **CORS Whitelisting** - Only allowed origins can access API
2. **JWT Authentication** - All protected endpoints require valid token
3. **Rate Limiting** - Prevents abuse and DDoS attacks
4. **Access Logging** - Audit trail for all requests
5. **HTTPS Only** - All traffic encrypted in transit

### ⏳ Future Enhancements

1. **Per-User Rate Limiting** - Different limits for different user tiers
2. **API Key Authentication** - For service-to-service communication
3. **Request Validation** - Schema validation at gateway level
4. **WAF Integration** - Web Application Firewall for advanced protection
5. **IP Whitelisting** - Restrict access to specific IP ranges (for admin endpoints)

---

## Monitoring and Alerts

### CloudWatch Metrics

**Available Metrics:**
- `Count` - Total number of requests
- `4XXError` - Client errors (400-499)
- `5XXError` - Server errors (500-599)
- `Latency` - Request latency (p50, p90, p99)
- `IntegrationLatency` - Backend processing time
- `DataProcessed` - Total data transferred

**Recommended Alarms:**

1. **High Error Rate:**
   ```
   Metric: 4XXError + 5XXError
   Threshold: > 10% of total requests
   Period: 5 minutes
   Action: Send SNS notification
   ```

2. **High Latency:**
   ```
   Metric: Latency (p99)
   Threshold: > 3000ms
   Period: 5 minutes
   Action: Send SNS notification
   ```

3. **Rate Limit Exceeded:**
   ```
   Metric: Count (status code 429)
   Threshold: > 100 requests
   Period: 1 minute
   Action: Send SNS notification
   ```

### CloudWatch Dashboards

**Create Dashboard:**
```bash
aws cloudwatch put-dashboard --dashboard-name WebDProAPI --dashboard-body file://dashboard.json
```

**dashboard.json:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", { "stat": "Sum" }],
          [".", "4XXError", { "stat": "Sum" }],
          [".", "5XXError", { "stat": "Sum" }]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "eu-north-1",
        "title": "API Requests and Errors"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Latency", { "stat": "Average" }],
          ["...", { "stat": "p99" }]
        ],
        "period": 300,
        "stat": "Average",
        "region": "eu-north-1",
        "title": "API Latency"
      }
    }
  ]
}
```

---

## Troubleshooting

### Issue: CORS Error in Browser

**Symptoms:**
```
Access to fetch at 'https://xxx.execute-api.eu-north-1.amazonaws.com/stores' 
from origin 'http://localhost:3001' has been blocked by CORS policy
```

**Causes:**
1. Origin not in whitelist
2. Missing required headers
3. Credentials not included

**Solutions:**
1. Add origin to `allowedOrigins` in serverless.yml
2. Include all required headers in request
3. Set `credentials: 'include'` in fetch options

### Issue: 401 Unauthorized

**Symptoms:**
```json
{
  "message": "Unauthorized"
}
```

**Causes:**
1. Missing Authorization header
2. Invalid JWT token
3. Expired JWT token
4. Wrong audience in token

**Solutions:**
1. Include `Authorization: Bearer <token>` header
2. Get new token from `/auth/otp/verify`
3. Refresh token if expired
4. Verify Cognito Client ID matches

### Issue: 429 Too Many Requests

**Symptoms:**
```json
{
  "message": "Too Many Requests"
}
```

**Causes:**
1. Exceeded burst limit (100 concurrent requests)
2. Exceeded rate limit (50 requests/second)

**Solutions:**
1. Implement exponential backoff retry logic
2. Reduce request frequency
3. Contact admin to increase limits

### Issue: 500 Internal Server Error

**Symptoms:**
```json
{
  "message": "Internal Server Error"
}
```

**Causes:**
1. Lambda function error
2. DynamoDB error
3. Missing environment variables

**Solutions:**
1. Check Lambda logs in CloudWatch
2. Check API Gateway access logs
3. Verify environment variables are set
4. Check IAM permissions

---

## Cost Optimization

### HTTP API Pricing

**Pricing (as of 2026):**
- First 300 million requests: $1.00 per million
- Next 700 million requests: $0.90 per million
- Over 1 billion requests: $0.80 per million

**Example Monthly Cost:**
- 10 million requests: $10.00
- 100 million requests: $100.00
- 1 billion requests: $970.00

**Comparison with REST API:**
- REST API: $3.50 per million requests
- HTTP API: $1.00 per million requests
- **Savings: 71%**

### Cost Optimization Tips

1. **Enable Caching** - Reduce backend invocations
2. **Optimize Lambda** - Reduce execution time
3. **Use Compression** - Reduce data transfer
4. **Monitor Usage** - Set up billing alerts
5. **Clean Up Logs** - Reduce CloudWatch storage costs

---

## References

### Specification Documents
- [Requirements](../.kiro/specs/webdpro-production-refactoring/requirements.md) - Requirements 7.3, 7.4, 16.1, 16.2, 16.3
- [Design](../.kiro/specs/webdpro-production-refactoring/design.md) - API Gateway design
- [Tasks](../.kiro/specs/webdpro-production-refactoring/tasks.md) - Task 4.1

### AWS Documentation
- [HTTP API Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
- [JWT Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [CORS Configuration](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html)
- [Throttling](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-throttling.html)

### Related Documentation
- [Refactoring Changelog](../docs/REFACTORING_CHANGELOG.md)
- [System Architecture](../docs/WEBDPRO_SYSTEM_EXPLAINED.md)

---

**End of Document**

*Last Updated: January 29, 2026*
