# WebDPro AI - Architectural Design Document

## 1. EXECUTIVE SUMMARY

### 1.1 System Overview
WebDPro AI is an AI-powered e-commerce platform that generates complete online stores from natural language prompts. The system leverages AWS serverless architecture with Bedrock AI to provide a scalable, cost-effective solution for India's small business market.

### 1.2 Current State Assessment
- **Maturity Level**: 40% Complete (Early MVP)
- **Production Readiness**: Not production-ready
- **Technical Debt**: Manageable with focused execution
- **Business Viability**: Strong market opportunity

### 1.3 Design Principles
1. **Serverless-First**: Minimize operational overhead
2. **Multi-Tenant**: Complete data isolation per business
3. **AI-Driven**: Leverage multiple AI models with fallbacks
4. **Cost-Optimized**: Usage-based pricing with cost controls
5. **India-Focused**: OTP authentication, COD support, vernacular languages

## 2. SYSTEM ARCHITECTURE

### 2.1 Logical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                          │
│ - Next.js 14 Frontend (AWS Amplify + CloudFront)           │
│ - Business Owner Dashboard                                  │
│ - Generated Storefronts                                     │
│ - Delivery Agent App                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ API GATEWAY LAYER                                           │
│ - AWS API Gateway (5 gateways)                             │
│ - Cognito Authorizer                                        │
│ - Rate Limiting (1000 req/min)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC LAYER (Lambda Functions)                    │
│ ┌─────────────┬──────────────┬──────────────┬─────────────┐│
│ │ Backend     │ AI Services  │ Inventory    │ Delivery    ││
│ │ (19 funcs)  │ (4 funcs)    │ (8 funcs)    │ (6 funcs)   ││
│ └─────────────┴──────────────┴──────────────┴─────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DATA LAYER                                                  │
│ - DynamoDB (7 tables)                                       │
│ - S3 (3 buckets)                                           │
│ - CloudFront (1 distribution)                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Physical Architecture

**Region Strategy**:
- **Primary Region**: eu-north-1 (Stockholm)
- **AI Region**: us-east-1 (Bedrock availability)
- **CDN**: Global (CloudFront edge locations)

**AWS Services**:
- Lambda: 40+ serverless functions
- Bedrock: AI model hosting (us-east-1)
- DynamoDB: 7 NoSQL tables
- S3: 3 buckets for storage
- CloudFront: 1 CDN distribution
- Cognito: User authentication
- SNS: Event notifications
- EventBridge: Event routing
- ACM: SSL certificates
- API Gateway: 5 REST APIs
- CloudWatch: Logging and monitoring



## 3. SERVICE DESIGN

### 3.1 Backend Service

**Purpose**: Core API for authentication, store management, orders, and domains

**Technology Stack**:
- Runtime: Node.js 18
- Framework: Serverless Framework
- Language: TypeScript
- Database: DynamoDB
- Authentication: AWS Cognito

**Lambda Functions** (19 total):
1. **Authentication**:
   - requestOTP: Send OTP to phone number
   - verifyOTP: Verify OTP and issue JWT
   - syncGoogleUser: Sync Google OAuth user
   - getProfile: Retrieve user profile
   - createAuthChallenge: Cognito custom auth
   - defineAuthChallenge: Define auth flow
   - verifyAuthChallengeResponse: Verify custom auth

2. **Store Management**:
   - generateStore: Initiate AI store generation
   - getStores: List user's stores
   - getStore: Get single store details
   - updateStore: Update store configuration
   - publishStore: Publish store to production
   - regenerateStore: Regenerate store with new prompt

3. **Domain Management**:
   - connectDomain: Connect custom domain
   - getDomainStatus: Check domain connection status
   - verifyDomain: Verify domain ownership

4. **Order Management**:
   - createOrder: Create new order
   - getOrder: Get order details
   - getStoreOrders: List orders for store
   - updateOrderStatus: Update order status

5. **Health Check**:
   - ping: Health check endpoint

**API Design**:
```typescript
// Store Generation Request
POST /stores/generate
Authorization: Bearer <jwt_token>
{
  "prompt": "Create a vegetable store for Mumbai",
  "businessType": "grocery",
  "location": "Mumbai",
  "language": "en"
}

// Response
{
  "success": true,
  "data": {
    "storeId": "store_abc123",
    "status": "GENERATING",
    "previewUrl": "https://d3qhkomcxcxmtl.cloudfront.net/drafts/store_abc123",
    "estimatedTime": 180
  },
  "metadata": {
    "requestId": "req_xyz789",
    "timestamp": "2026-02-03T10:30:00Z",
    "version": "1.0"
  }
}
```

**Error Handling**:
```typescript
class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, any> = {}
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

// Usage
throw new ValidationError('Invalid prompt length', {
  minLength: 10,
  maxLength: 1000,
  actualLength: prompt.length
})
```

**Multi-Tenant Isolation**:
```typescript
function getTenantId(event: APIGatewayProxyEvent): string {
  const claims = event.requestContext.authorizer?.claims
  const tenantId = claims?.['custom:tenant_id']
  
  if (!tenantId) {
    throw new AuthorizationError('Tenant ID not found in token')
  }
  
  return tenantId
}

// All DynamoDB queries include tenant_id
const params = {
  TableName: 'webdpro-stores',
  KeyConditionExpression: 'tenant_id = :tenantId',
  ExpressionAttributeValues: {
    ':tenantId': tenantId
  }
}
```

### 3.2 AI Services

**Purpose**: AI-powered website generation with multi-model orchestration

**Technology Stack**:
- Runtime: Node.js 18
- Framework: Serverless Framework
- Language: TypeScript
- AI: AWS Bedrock
- Storage: S3
- CDN: CloudFront

**Lambda Functions** (4 total):
1. **generateSpec**: Generate business specification from prompt
2. **generateCode**: Generate React/Tailwind code from spec
3. **generateImages**: Generate AI images for store
4. **generateWebsite**: Complete pipeline orchestration

**AI Generation Pipeline**:

```
Stage 1: Spec Generation (10s)
┌─────────────────────────────────────────┐
│ Input: Natural language prompt          │
│ Model: Claude 3.5 Sonnet                │
│ Output: JSON specification              │
│ {                                       │
│   "name": "Fresh Veggies Mumbai",       │
│   "description": "...",                 │
│   "products": [...],                    │
│   "theme": { "primary": "#10B981" }     │
│ }                                       │
└─────────────────────────────────────────┘
                ↓
Stage 2: Code Generation (15s)
┌─────────────────────────────────────────┐
│ Input: JSON spec                        │
│ Model: Claude 3.5 Sonnet → Haiku       │
│ Output: React components + Tailwind CSS │
│ - Header component                      │
│ - Hero section                          │
│ - Product grid                          │
│ - Footer component                      │
└─────────────────────────────────────────┘
                ↓
Stage 3: Image Generation (20s)
┌─────────────────────────────────────────┐
│ Input: Business type + descriptions     │
│ Model: Amazon Titan → SDXL             │
│ Output: Hero images, product images     │
│ - Hero banner image                     │
│ - Product placeholder images            │
│ - Background patterns                   │
└─────────────────────────────────────────┘
                ↓
Stage 4: Website Assembly (5s)
┌─────────────────────────────────────────┐
│ Input: Code + Images                    │
│ Action: Upload to S3, invalidate CDN   │
│ Output: Live website URL                │
│ https://d3qhkomcxcxmtl.cloudfront.net/ │
│ stores/store_abc123/index.html          │
└─────────────────────────────────────────┘
```

**Multi-Model Fallback Strategy**:
```typescript
class ModelOrchestrator {
  private readonly fallbackChain = [
    { provider: 'bedrock', model: 'claude-3-5-sonnet', cost: 0.015 },
    { provider: 'bedrock', model: 'claude-3-haiku', cost: 0.00025 },
    { provider: 'bedrock', model: 'amazon-titan', cost: 0.0008 },
    { provider: 'bedrock', model: 'meta-llama-2-70b', cost: 0.00195 },
    { provider: 'local', model: 'rule-based', cost: 0 }
  ]
  
  async generate(prompt: string): Promise<AIResult> {
    for (const config of this.fallbackChain) {
      try {
        const result = await this.callProvider(config, prompt)
        if (await this.validateQuality(result)) {
          return result
        }
      } catch (error) {
        logger.warn(`Provider ${config.provider} failed`, error)
        continue
      }
    }
    
    throw new AIGenerationError('All providers failed')
  }
}
```

**Cost Optimization**:
```typescript
class CostOptimizer {
  analyzeComplexity(prompt: string): number {
    // Simple heuristics for prompt complexity
    const wordCount = prompt.split(' ').length
    const hasSpecialRequirements = /custom|advanced|complex/.test(prompt)
    
    let score = wordCount / 100 // Base score from length
    if (hasSpecialRequirements) score += 0.3
    
    return Math.min(score, 1.0)
  }
  
  selectModel(complexity: number, budget: number): ModelConfig {
    if (complexity < 0.3 && budget < 0.01) {
      return { model: 'claude-haiku', cost: 0.00025 }
    }
    if (complexity > 0.7 || budget > 0.02) {
      return { model: 'claude-3-5-sonnet', cost: 0.015 }
    }
    return { model: 'amazon-titan', cost: 0.0008 }
  }
}
```

### 3.3 Inventory Service

**Purpose**: Product catalog and stock management with AI predictions

**Technology Stack**:
- Runtime: Node.js 18
- Framework: Serverless Framework
- Language: TypeScript
- Database: DynamoDB
- Events: SNS, EventBridge

**Lambda Functions** (8 total):
1. **createProduct**: Add new product to catalog
2. **getProducts**: List products for store
3. **updateProduct**: Update product details
4. **deleteProduct**: Remove product from catalog
5. **updateStock**: Update stock quantity
6. **getLowStock**: Get low-stock alerts
7. **predictStock**: AI-powered demand forecasting
8. **handleEvents**: Process order events for stock updates

**Data Model**:
```typescript
interface Product {
  storeId: string          // Partition key
  productId: string        // Sort key
  name: string
  description: string
  price: number
  currency: string
  category: string
  images: string[]
  stockQuantity: number
  lowStockThreshold: number
  isActive: boolean
  prediction?: {
    nextWeekDemand: number
    confidence: number
    lastUpdated: string
  }
  createdAt: string
  updatedAt: string
}
```

**Event-Driven Stock Updates**:
```typescript
// Order placed event triggers stock deduction
async function handleOrderPlaced(event: OrderPlacedEvent) {
  for (const item of event.items) {
    await updateStock({
      storeId: event.storeId,
      productId: item.productId,
      quantity: -item.quantity  // Deduct stock
    })
    
    // Check if low stock alert needed
    const product = await getProduct(event.storeId, item.productId)
    if (product.stockQuantity <= product.lowStockThreshold) {
      await sendLowStockAlert(product)
    }
  }
}
```

### 3.4 Delivery Service

**Purpose**: Order fulfillment and delivery tracking

**Technology Stack**:
- Runtime: Node.js 18
- Framework: Serverless Framework
- Language: TypeScript
- Database: DynamoDB
- Location: Amazon Location Service (planned)

**Lambda Functions** (6 total):
1. **assignDelivery**: Assign order to delivery agent
2. **getDeliveryStatus**: Get delivery status
3. **updateTracking**: Update GPS location
4. **recordCashCollection**: Record COD collection
5. **getAgentAssignments**: List agent's deliveries
6. **getCashSummary**: Daily cash reconciliation

**Data Model**:
```typescript
interface Delivery {
  agentId: string          // Partition key
  deliveryId: string       // Sort key
  orderId: string
  tenantId: string
  storeId: string
  status: DeliveryStatus
  customerName: string
  customerPhone: string
  deliveryAddress: string
  isCOD: boolean
  codAmount?: number
  codCollected?: boolean
  codCollectedAmount?: number
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: string
  }
  pickedUpAt?: string
  deliveredAt?: string
  createdAt: string
}

enum DeliveryStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}
```

**Status Flow**:
```
PENDING → PICKED_UP → IN_TRANSIT → DELIVERED
                                 ↓
                              FAILED
```

### 3.5 Payments Service

**Purpose**: Payment processing and subscription management

**Technology Stack**:
- Runtime: Node.js 18
- Framework: Serverless Framework
- Language: TypeScript
- Payment Gateway: Razorpay
- Database: DynamoDB

**Lambda Functions** (4 total):
1. **createCheckout**: Create Razorpay checkout session
2. **verifyPayment**: Verify payment signature
3. **createSubscription**: Create merchant subscription
4. **handleWebhook**: Process Razorpay webhooks

**Dual Payment Flow**:

**Flow A: Merchant → WebDPro (Subscription)**
```typescript
async function createSubscription(tenantId: string, plan: string) {
  // Create Razorpay order using WebDPro's keys
  const order = await razorpay.orders.create({
    amount: PLAN_PRICES[plan] * 100, // ₹999 = 99900 paise
    currency: 'INR',
    receipt: `sub_${tenantId}_${Date.now()}`,
    notes: {
      tenantId,
      plan,
      type: 'subscription'
    }
  })
  
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency
  }
}
```

**Flow B: Customer → Merchant (Order Payment)**
```typescript
async function createOrderCheckout(orderId: string) {
  const order = await getOrder(orderId)
  const store = await getStore(order.storeId)
  
  // Use merchant's Razorpay keys (stored in store config)
  const merchantRazorpay = new Razorpay({
    key_id: store.razorpayKeyId,
    key_secret: store.razorpayKeySecret
  })
  
  const razorpayOrder = await merchantRazorpay.orders.create({
    amount: order.totalAmount * 100,
    currency: 'INR',
    receipt: `order_${orderId}`,
    notes: {
      orderId,
      storeId: order.storeId
    }
  })
  
  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    merchantKeyId: store.razorpayKeyId
  }
}
```

**Webhook Verification**:
```typescript
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

