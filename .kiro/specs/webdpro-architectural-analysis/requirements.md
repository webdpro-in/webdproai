# WebDPro AI - Architectural Analysis Requirements

## 1. PROJECT OVERVIEW

### 1.1 System Description
WebDPro AI is a prompt-to-ecommerce SaaS platform that uses AWS Bedrock AI to generate complete online stores from natural language descriptions. The platform targets India's 63 million small businesses, providing an AI-powered alternative to traditional e-commerce platforms like Shopify.

### 1.2 Core Value Proposition
- **Input**: Natural language prompt (e.g., "Create a shoe store in Delhi")
- **Output**: Fully functional e-commerce website with products, cart, checkout
- **Time**: 2-3 minutes (vs weeks of manual development)
- **Cost**: ₹999/month (vs ₹50,000+ for custom development)

### 1.3 Target Market
- **Primary**: Small and medium businesses in India
- **Secondary**: Franchise operations and multi-store businesses
- **Tertiary**: Enterprise white-label solutions

## 2. SYSTEM ARCHITECTURE REQUIREMENTS

### 2.1 High-Level Architecture

#### 2.1.1 Presentation Layer
- **Frontend Application**: Next.js 14 with App Router
  - Business Owner Dashboard (store creation/management)
  - Generated Storefronts (customer-facing e-commerce)
  - Delivery Agent App (order fulfillment)
  - Super Admin Panel (platform oversight)
- **Hosting**: AWS Amplify with CloudFront CDN
- **Authentication**: AWS Cognito with OTP and Google OAuth

#### 2.1.2 API Gateway Layer
- **Service**: AWS API Gateway
- **Authentication**: Cognito Authorizer
- **Rate Limiting**: 1000 requests/minute per tenant
- **Multi-Tenant Routing**: Tenant-based request isolation

#### 2.1.3 Business Logic Layer
- **Backend Service** (eu-north-1)
  - Authentication and user management
  - Store CRUD operations
  - Order processing
  - Domain management
  - Payment webhooks
- **AI Services** (cross-region: eu-north-1 → us-east-1)
  - Bedrock AI integration
  - Multi-model fallback orchestration
  - Image generation
  - Website assembly and deployment
- **Inventory Service** (eu-north-1)
  - Product management
  - Stock tracking
  - Low-stock alerts
  - AI-powered demand prediction
- **Delivery Service** (eu-north-1)
  - Agent assignment
  - Real-time tracking
  - COD collection management
- **Payments Service** (eu-north-1)
  - Razorpay integration
  - Subscription management
  - Merchant onboarding

#### 2.1.4 Data Layer
- **DynamoDB Tables** (7 tables)
  - webdpro-users
  - webdpro-tenants
  - webdpro-stores
  - webdpro-products
  - webdpro-orders
  - webdpro-deliveries
  - webdpro-payments
- **S3 Buckets**
  - webdpro-ai-storage (generated websites)
  - webdpro-assets (images and static files)
  - webdpro-backups (disaster recovery)
- **CloudFront Distribution**
  - Global CDN for generated websites
  - Distribution ID: d3qhkomcxcxmtl

#### 2.1.5 External Integrations
- **AWS Bedrock** (us-east-1)
  - Claude 3.5 Sonnet (primary text generation)
  - Claude 3 Haiku (fallback text generation)
  - Amazon Titan Image Generator (image generation)
  - Stability AI SDXL (fallback image generation)
- **Razorpay**
  - Dual-flow payments (subscriptions + orders)
  - Merchant onboarding
  - Webhook processing
- **Hostinger**
  - Domain management
  - DNS configuration
- **AWS SNS**
  - SMS notifications
  - Email notifications (future)
  - Event-driven communication

### 2.2 Service Boundaries

#### 2.2.1 Backend Service
**Responsibilities**:
- User authentication and authorization
- Store lifecycle management (create, update, publish, delete)
- Order processing and status management
- Domain connection and verification
- Payment webhook handling
- Multi-tenant data isolation

**API Endpoints**:
- POST /auth/otp/request - Request OTP for phone
- POST /auth/otp/verify - Verify OTP and get tokens
- POST /auth/google/sync - Sync Google user
- GET /auth/profile - Get user profile
- POST /stores/generate - Generate new store
- GET /stores - List user stores
- GET /stores/{id} - Get store details
- PUT /stores/{id} - Update store
- POST /stores/{id}/publish - Publish store to production
- POST /stores/{id}/domain - Connect custom domain
- GET /stores/{id}/domain/status - Check domain status
- POST /stores/{id}/domain/verify - Verify domain ownership
- POST /stores/{id}/orders - Create order
- GET /orders/{id} - Get order details
- GET /stores/{id}/orders - List store orders
- PUT /orders/{id}/status - Update order status

**Dependencies**:
- AWS Cognito (authentication)
- DynamoDB (data storage)
- AI Services (store generation)
- SNS (event notifications)

#### 2.2.2 AI Services
**Responsibilities**:
- AI-powered website generation
- Multi-model orchestration and fallback
- Image generation and optimization
- Website assembly and S3 deployment
- Cost tracking and optimization

**API Endpoints**:
- POST /ai/generate - Full generation pipeline
- POST /generate/spec - Generate business spec
- POST /generate/code - Generate website code
- POST /generate/images - Generate AI images
- POST /generate/website - Complete website assembly

**Generation Pipeline** (4 stages):
1. **Spec Generation** (10s)
   - Input: Natural language prompt
   - Output: JSON specification
   - Model: Claude 3.5 Sonnet
2. **Code Generation** (15s)
   - Input: JSON spec
   - Output: React components + Tailwind CSS
   - Model: Claude 3.5 Sonnet → Haiku (fallback)
3. **Image Generation** (20s)
   - Input: Business type + product descriptions
   - Output: Hero images, product images
   - Model: Amazon Titan → SDXL (fallback)
4. **Website Assembly** (5s)
   - Input: Code + Images
   - Output: Deployed website on S3 + CloudFront
   - Action: Upload to S3, invalidate CloudFront cache

**Dependencies**:
- AWS Bedrock (AI models)
- S3 (website storage)
- CloudFront (CDN)

#### 2.2.3 Inventory Service
**Responsibilities**:
- Product catalog management
- Real-time stock tracking
- Low-stock alerts
- AI-powered demand forecasting
- Event-driven stock updates

**API Endpoints**:
- POST /products - Create product
- GET /products - List products
- GET /products/{id} - Get product details
- PUT /products/{id} - Update product
- DELETE /products/{id} - Delete product
- PUT /products/{id}/stock - Update stock level
- GET /products/low-stock - Get low-stock alerts
- GET /products/predictions - Get demand forecast

**Dependencies**:
- DynamoDB (product storage)
- SNS (stock alerts)
- EventBridge (order events)

#### 2.2.4 Delivery Service
**Responsibilities**:
- Delivery agent management
- Order assignment to agents
- Real-time location tracking
- COD collection and reconciliation
- Delivery status notifications

**API Endpoints**:
- POST /deliveries/assign - Assign order to agent
- GET /deliveries/{id} - Get delivery status
- PUT /deliveries/{id}/track - Update location
- POST /deliveries/{id}/cash - Record cash collection
- GET /deliveries/agent/{id}/assignments - Get agent's orders
- GET /deliveries/agent/{id}/cash-summary - Daily cash summary

**Dependencies**:
- DynamoDB (delivery records)
- SNS (status notifications)
- Amazon Location Service (GPS tracking - planned)

#### 2.2.5 Payments Service
**Responsibilities**:
- Razorpay integration
- Subscription payment processing
- Order payment processing
- Merchant onboarding
- Webhook handling and verification

**API Endpoints**:
- POST /checkout/create - Create checkout session
- POST /checkout/verify - Verify payment
- POST /subscription/create - Create subscription
- POST /subscription/cancel - Cancel subscription
- POST /onboarding/connect - Connect merchant Razorpay
- POST /webhooks/razorpay - Handle payment webhooks

**Payment Flows**:
- **Flow A**: Merchant → WebDPro (subscription fees)
- **Flow B**: Customer → Merchant (order payments)

**Dependencies**:
- Razorpay API
- DynamoDB (payment records)
- SNS (payment events)

### 2.3 Data Flow Requirements

#### 2.3.1 Store Generation Flow
```
User (Frontend) → Login (Cognito) → Dashboard → Generate Store
       ↓
Frontend POST /stores/generate (with JWT) → Backend Lambda
       ↓
Backend → AI Service POST /ai/generate (input, tenantId, storeId)
       ↓
AI Service → Bedrock (spec → code → images) → S3 upload → response
       ↓
Backend → DynamoDB store record, S3 draft → response to Frontend
       ↓
User sees preview_url, can publish (→ live S3 + CloudFront)
```

#### 2.3.2 Order Processing Flow
```
Customer adds items → Frontend cart
       ↓
Checkout → Backend creates order (PENDING_PAYMENT)
       ↓
Payment → Razorpay (merchant's account)
       ↓
Webhook → Backend updates order (CONFIRMED)
       ↓
SNS event → Inventory deducts stock
       ↓
SNS event → Delivery assigns agent
       ↓
Agent receives assignment → Mobile app
       ↓
Status updates → Delivery Service → DynamoDB
       ↓
Customer tracking → Real-time status via API
```

#### 2.3.3 Delivery Flow
```
Agent receives assignment → Mobile app
       ↓
Status updates → Delivery Service → DynamoDB
       ↓
Customer tracking → Real-time status via API
       ↓
COD collection → Recorded in delivery record
       ↓
Daily cash summary → Auto-generated
```

### 2.4 Multi-Tenancy Requirements

#### 2.4.1 Data Isolation
- All DynamoDB tables use tenant_id as partition key or GSI
- Row-level security enforcement in all queries
- Automatic tenant_id injection from JWT claims
- No cross-tenant data access allowed

#### 2.4.2 Resource Quotas
- Store generation limits per plan
- API rate limiting per tenant
- Storage quotas per tenant
- AI generation credits per plan

#### 2.4.3 Tenant Context
- JWT contains custom:tenant_id claim
- All API requests validated for tenant ownership
- Tenant context propagated through all services
- Audit logging per tenant

## 3. AI ARCHITECTURE REQUIREMENTS

### 3.1 Multi-Model Strategy

#### 3.1.1 Model Abstraction Layer
- Provider-agnostic interface for AI operations
- Cost-aware routing based on prompt complexity
- Quality gates for output validation
- Automatic fallback on provider failures

#### 3.1.2 Provider Ecosystem
**Tier 1: Primary Providers** (High Quality, Higher Cost)
- AWS Bedrock Claude 3.5 Sonnet (text generation)
- Amazon Titan Image Generator (image generation)

**Tier 2: Cost-Optimized** (Good Quality, Lower Cost)
- AWS Bedrock Claude Haiku (simple text tasks)
- Stability AI SDXL (standard image generation)

**Tier 3: Fallback & Specialized** (Reliability Focus)
- Local Llama models (offline capability)
- Rule-based generators (guaranteed output)
- Template systems (zero-cost fallback)

#### 3.1.3 Fallback Chain
```
Level 1: Claude 3.5 Sonnet (Primary)
  ↓ (on failure)
Level 2: Claude 3 Haiku (Fast)
  ↓ (on failure)
Level 3: Amazon Titan Express
  ↓ (on failure)
Level 4: Meta Llama 2 70B
  ↓ (on failure)
Level 5: Rule-Based Generator (Offline)
```

### 3.2 Prompt Engineering Requirements

#### 3.2.1 Versioned Prompt Management
- All prompts stored in DynamoDB
- Version control for prompt templates
- A/B testing framework for prompt optimization
- Success rate and cost tracking per version

#### 3.2.2 Prompt Security
- Input sanitization to prevent injection attacks
- Dangerous pattern detection
- Content filtering for safety
- Output validation before storage

#### 3.2.3 Supported Store Types (Rule-Based)
- Grocery: vegetable, grocery, kirana (Green theme)
- Restaurant: restaurant, food, biryani (Red theme)
- Clinic: doctor, clinic, dental (Blue theme)
- Fashion: clothing, boutique, fashion (Purple theme)
- General: default (Indigo theme)

### 3.3 AI Observability Requirements

#### 3.3.1 Quality Monitoring
- Real-time quality scoring
- Safety validation
- Relevance checking
- Technical correctness validation
- Brand compliance verification

#### 3.3.2 Cost Tracking
- Token counting per request
- Cost attribution per tenant
- Monthly usage tracking
- Budget alerts and limits
- Cost optimization recommendations

#### 3.3.3 Performance Metrics
- Generation time tracking
- Success rate monitoring
- Fallback frequency analysis
- Provider performance comparison

## 4. SECURITY REQUIREMENTS

### 4.1 Authentication & Authorization

#### 4.1.1 User Authentication
- OTP-based phone authentication via Cognito
- Google OAuth integration
- JWT token-based session management
- Token refresh mechanism
- Secure token storage

#### 4.1.2 API Authorization
- JWT signature verification
- Custom claims validation (tenant_id)
- API Gateway custom authorizer
- Role-based access control (RBAC)
- Resource ownership validation

#### 4.1.3 Multi-Tenant Security
- Tenant isolation enforcement
- Cross-tenant access prevention
- Tenant context validation
- Audit logging per tenant

### 4.2 Data Security

#### 4.2.1 Data at Rest
- DynamoDB encryption enabled
- S3 bucket encryption (AES-256)
- Secrets Manager for sensitive data
- Automatic secret rotation

#### 4.2.2 Data in Transit
- HTTPS enforcement for all APIs
- TLS 1.2+ for all connections
- Certificate management via ACM
- HSTS headers implementation

#### 4.2.3 Input Validation
- Zod schema validation for all inputs
- SQL/NoSQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting per user/tenant

### 4.3 AI Security

#### 4.3.1 Prompt Injection Prevention
- Dangerous pattern detection
- Input sanitization
- Content filtering
- Output validation

#### 4.3.2 Generated Content Security
- HTML sanitization (DOMPurify)
- CSS validation
- JavaScript removal
- XSS prevention in generated sites

## 5. SCALABILITY REQUIREMENTS

### 5.1 Performance Targets

#### 5.1.1 API Response Times
- Authentication: <200ms
- Store listing: <300ms
- Store generation initiation: <500ms
- Order creation: <400ms
- Product queries: <200ms

#### 5.1.2 AI Generation Times
- Spec generation: <10s
- Code generation: <15s
- Image generation: <20s
- Website assembly: <5s
- Total generation: <60s

#### 5.1.3 Availability Targets
- Phase 0-1: 99.9% uptime
- Phase 2: 99.95% uptime
- Phase 3+: 99.99% uptime

### 5.2 Capacity Planning

#### 5.2.1 User Scale
- Phase 0-1: 1,000 paying customers
- Phase 2: 10,000 paying customers
- Phase 3: 50,000 paying customers
- Phase 4: 100,000+ paying customers

#### 5.2.2 Transaction Volume
- Orders per day: 10,000 - 100,000
- AI generations per day: 1,000 - 10,000
- API requests per minute: 10,000 - 100,000

#### 5.2.3 Storage Requirements
- Generated websites: 100MB per store
- Product images: 50MB per store
- Database records: 1KB - 10KB per record
- Total storage: 1TB - 100TB

### 5.3 Auto-Scaling Requirements

#### 5.3.1 Lambda Functions
- Concurrent execution limits per function
- Reserved concurrency for critical functions
- Provisioned concurrency for low-latency
- Automatic scaling based on demand

#### 5.3.2 DynamoDB
- On-demand capacity mode (Phase 0-1)
- Provisioned capacity with auto-scaling (Phase 2+)
- Global secondary indexes for query optimization
- DynamoDB Accelerator (DAX) for caching (Phase 3+)

#### 5.3.3 S3 and CloudFront
- Automatic scaling (built-in)
- CloudFront edge caching
- S3 Transfer Acceleration (Phase 2+)
- Multi-region replication (Phase 3+)

## 6. MONITORING & OBSERVABILITY REQUIREMENTS

### 6.1 Logging Requirements

#### 6.1.1 Structured Logging
- JSON-formatted logs
- Correlation IDs for request tracing
- Log levels: DEBUG, INFO, WARN, ERROR
- Contextual information (tenant_id, user_id, request_id)

#### 6.1.2 Log Aggregation
- CloudWatch Logs for all services
- Log retention: 30 days (Phase 0-1), 90 days (Phase 2+)
- Log insights for querying
- Log exports to S3 for long-term storage

### 6.2 Metrics Requirements

#### 6.2.1 Application Metrics
- API request count and latency
- Error rates per endpoint
- AI generation success rates
- Cost per generation
- User activity metrics

#### 6.2.2 Infrastructure Metrics
- Lambda invocation count and duration
- DynamoDB read/write capacity
- S3 storage and bandwidth
- CloudFront cache hit ratio
- API Gateway throttling

#### 6.2.3 Business Metrics
- Active users per day/month
- Store generation count
- Order volume and GMV
- Revenue (MRR, ARR)
- Churn rate

### 6.3 Alerting Requirements

#### 6.3.1 Critical Alerts
- API error rate > 5%
- AI generation failure rate > 10%
- Database connection failures
- Payment processing failures
- Security incidents

#### 6.3.2 Warning Alerts
- API latency > 1s
- Cost exceeding budget
- Low stock alerts
- Approaching rate limits
- Certificate expiration

#### 6.3.3 Alert Channels
- SNS for critical alerts
- Email for warnings
- Slack integration (Phase 2+)
- PagerDuty integration (Phase 3+)

## 7. DEPLOYMENT & OPERATIONS REQUIREMENTS

### 7.1 Infrastructure as Code

#### 7.1.1 Serverless Framework
- All Lambda functions defined in serverless.yml
- Environment-specific configurations
- Resource naming conventions
- IAM role definitions

#### 7.1.2 Terraform (Future)
- Complete infrastructure definition
- State management in S3
- Multi-environment support
- Modular resource definitions

### 7.2 CI/CD Requirements

#### 7.2.1 Build Pipeline
- Automated testing (unit, integration, e2e)
- Code linting and formatting
- Security scanning
- Dependency vulnerability checks
- Build artifact generation

#### 7.2.2 Deployment Pipeline
- Staging environment deployment
- Smoke tests in staging
- Production deployment with approval
- Rollback capability
- Blue-green deployment (Phase 2+)

### 7.3 Disaster Recovery

#### 7.3.1 Backup Strategy
- DynamoDB point-in-time recovery
- S3 versioning enabled
- Cross-region replication (Phase 3+)
- Automated backup testing

#### 7.3.2 Recovery Objectives
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Data retention: 30 days

## 8. COST OPTIMIZATION REQUIREMENTS

### 8.1 Cost Targets

#### 8.1.1 Development Environment
- Monthly cost: $25-40
- Lambda: $5-10
- Bedrock: $10-30
- DynamoDB: $5-10
- S3 + CloudFront: $5-10

#### 8.1.2 Production Environment (1,000 users)
- Monthly cost: $50-80
- Lambda: $20-50
- Bedrock: $100-200
- DynamoDB: $50-100
- S3 + CloudFront: $50-100

### 8.2 Cost Optimization Strategies

#### 8.2.1 AI Cost Optimization
- Cost-aware model routing
- Prompt complexity analysis
- Caching of common generations
- Batch processing where possible

#### 8.2.2 Infrastructure Cost Optimization
- Reserved capacity for predictable workloads
- Spot instances for batch processing (future)
- S3 lifecycle policies
- CloudFront cache optimization

## 9. COMPLIANCE & GOVERNANCE REQUIREMENTS

### 9.1 Data Privacy

#### 9.1.1 GDPR Compliance (Future)
- User consent management
- Right to be forgotten
- Data portability
- Privacy policy

#### 9.1.2 Indian Data Protection
- Data residency in India (eu-north-1)
- User data encryption
- Access controls
- Audit logging

### 9.2 Payment Compliance

#### 9.2.1 PCI DSS
- No storage of card data
- Razorpay handles all payment data
- Secure webhook verification
- Transaction logging

### 9.3 AI Governance

#### 9.3.1 Responsible AI
- Content safety filters
- Bias detection and mitigation
- Transparency in AI usage
- Human oversight for critical decisions

## 10. ACCEPTANCE CRITERIA

### 10.1 Functional Requirements
- [ ] User can register and login via OTP
- [ ] User can generate store from natural language prompt
- [ ] Generated store is accessible via unique URL
- [ ] User can publish store after payment
- [ ] Customer can browse products and place orders
- [ ] Delivery agent can manage assignments
- [ ] Admin can monitor platform health

### 10.2 Non-Functional Requirements
- [ ] API response time < 500ms (95th percentile)
- [ ] AI generation success rate > 90%
- [ ] System uptime > 99.9%
- [ ] Multi-tenant data isolation verified
- [ ] Security vulnerabilities < 5 (medium or higher)
- [ ] Test coverage > 80%

### 10.3 Documentation Requirements
- [ ] API documentation (OpenAPI 3.0)
- [ ] Architecture diagrams
- [ ] Deployment guide
- [ ] Runbook for operations
- [ ] User documentation

## 11. FUTURE ENHANCEMENTS

### 11.1 Phase 2 Features
- Advanced analytics dashboard
- Mobile app for store owners
- Multi-language support
- Enterprise SSO integration
- Advanced customization

### 11.2 Phase 3 Features
- Custom AI model training
- Voice and video generation
- Advanced personalization
- Marketplace for templates
- White-label solutions

### 11.3 Phase 4 Features
- Open API platform
- Partner ecosystem
- International expansion
- Advanced compliance tools
- Multi-region deployment
