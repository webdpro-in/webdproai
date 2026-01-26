# 🚀 WebDPro AI - Complete Project Flow Guide

> **Version**: 1.0  
> **Last Updated**: January 2026  
> **Future-Proof**: 5-7 Years (with recommended upgrades)

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture at a Glance](#-architecture-at-a-glance)
3. [Technology Stack](#-technology-stack)
4. [Complete User Flows](#-complete-user-flows)
5. [API Reference](#-api-reference)
6. [AI Model Fallback Chain](#-ai-model-fallback-chain)
7. [Database Design](#-database-design)
8. [Folder Structure](#-folder-structure)
9. [Deployment Guide](#-deployment-guide)
10. [Future-Proofing Strategy](#-future-proofing-strategy)
11. [Cost Breakdown](#-cost-breakdown)

---

## 🎯 Project Overview

**WebDPro AI** is a prompt-to-ecommerce SaaS platform that generates, deploys, and manages sector-specific commerce websites in under 10 minutes using AI.

### What It Does

```
User Input: "Create a vegetable store for Curam in Mumbai with green theme"
     ↓
AI Magic: AWS Bedrock (Claude 3) generates complete website
     ↓
Output: Live e-commerce website at curam.webdpro.in
```

### Key Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Website Generation | Natural language → Complete website in 4-5 minutes |
| 🛒 E-commerce Ready | Built-in cart, checkout, payments (Razorpay) |
| 📦 Inventory Management | AI-powered stock predictions |
| 🚚 Delivery Tracking | Real-time agent tracking, COD support |
| 👥 Multi-Tenant | Complete data isolation per business |
| 📱 Mobile-First | OTP-only authentication, no passwords |

---

## 🏗 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           WEBDPRO AI ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USERS                     ENTRY POINT              AUTHENTICATION       │
│  ──────                    ───────────              ──────────────       │
│  👤 Business Owner    →    🌐 webdpro.ai       →    🔐 Cognito OTP       │
│  👤 Customer          →    🏪 store.webdpro.in →    📱 Phone Login       │
│  👤 Delivery Agent    →    📱 Agent App        →    🔐 Cognito OTP       │
│  👤 Super Admin       →    ⚙️ Admin Panel      →    📧 Email Login       │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FRONTEND                  API LAYER                 AI LAYER            │
│  ────────                  ─────────                 ────────            │
│  ⚛️ React + Next.js        🔀 API Gateway            🧠 AWS Bedrock       │
│  ☁️ AWS Amplify            λ Lambda Functions       │→ Claude 3 Sonnet  │
│  🌍 CloudFront CDN         🔒 Cognito Authorizer    │→ Claude 3 Haiku   │
│                                                     │→ Amazon Titan     │
│                                                     │→ Meta Llama 2     │
│                                                     │→ Rule-based ⚡    │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DATA LAYER               STORAGE                   EXTERNAL             │
│  ──────────               ───────                   ────────             │
│  📊 DynamoDB              📁 S3 Bucket               💳 Razorpay          │
│  │→ Tenants               │→ Generated Sites       │→ Payments          │
│  │→ Users                 │→ Assets/Images         │→ Subscriptions     │
│  │→ Stores                │→ Backups               │→ Payouts           │
│  │→ Products                                                             │
│  │→ Orders                🌐 Route 53               🌐 Hostinger         │
│  │→ Deliveries            │→ DNS                   │→ Custom Domains    │
│  │→ Payments              │→ webdpro.in                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

| Layer | Technology | Why This Choice | Future-Proof Rating |
|-------|------------|-----------------|---------------------|
| **Frontend** | Next.js 14 + React 18 | Industry standard, excellent DX | ⭐⭐⭐⭐⭐ |
| **Hosting** | AWS Amplify | Native AWS, auto CI/CD | ⭐⭐⭐⭐⭐ |
| **API** | AWS Lambda + API Gateway | Serverless, scales to millions | ⭐⭐⭐⭐⭐ |
| **AI** | AWS Bedrock | Multi-model, enterprise-grade | ⭐⭐⭐⭐⭐ |
| **Database** | DynamoDB | Serverless, infinite scale | ⭐⭐⭐⭐⭐ |
| **Auth** | AWS Cognito | OTP-ready, secure | ⭐⭐⭐⭐ |
| **Storage** | S3 + CloudFront | Global CDN, cheap | ⭐⭐⭐⭐⭐ |
| **Payments** | Razorpay | India-focused, UPI+COD | ⭐⭐⭐⭐ |
| **Language** | TypeScript | Type safety, better DX | ⭐⭐⭐⭐⭐ |

---

## 👥 Complete User Flows

### Flow 1: Business Owner - Create Store

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS OWNER JOURNEY                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. REGISTRATION                                                          │
│     ────────────                                                          │
│     📱 Opens webdpro.ai                                                   │
│          ↓                                                                │
│     📝 Enters phone: +91 9876543210                                       │
│          ↓                                                                │
│     📲 Receives OTP via SMS                                               │
│          ↓                                                                │
│     ✅ Verified → Dashboard loaded                                        │
│                                                                           │
│  2. STORE GENERATION                                                      │
│     ─────────────────                                                     │
│     💬 Enters: "Vegetable store for Curam, Mumbai, green theme"          │
│          ↓                                                                │
│     🤖 AI Processing (3-5 minutes):                                       │
│        • Bedrock generates HTML/React code                                │
│        • Tailwind CSS with green theme                                    │
│        • SEO content and meta tags                                        │
│        • Product image placeholders                                       │
│          ↓                                                                │
│     👁️ Preview shown in dashboard                                        │
│          ↓                                                                │
│     ✏️ Inline editing (optional):                                         │
│        • Change text → Bedrock regenerates                                │
│        • Change images → Stable Diffusion                                 │
│                                                                           │
│  3. PAYMENT & PUBLISH                                                     │
│     ─────────────────                                                     │
│     💳 Payment via Razorpay (₹999 first store)                           │
│          ↓                                                                │
│     🚀 Publish clicked                                                    │
│          ↓                                                                │
│     🌐 Live at: curam.webdpro.in (or custom domain)                      │
│          ↓                                                                │
│     📧 Confirmation email sent                                            │
│                                                                           │
│  4. MANAGE STORE                                                          │
│     ────────────                                                          │
│     📦 Add products to inventory                                          │
│     📊 View orders in real-time                                           │
│     🚚 Assign delivery agents                                             │
│     💰 Track payouts in Razorpay                                          │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flow 2: Customer - Place Order

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       CUSTOMER JOURNEY                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. BROWSE                                                                │
│     ──────                                                                │
│     🌐 Visits curam.webdpro.in                                           │
│          ↓                                                                │
│     📱 Site loads via CloudFront (fast!)                                  │
│          ↓                                                                │
│     🛒 Browses products, adds to cart                                     │
│                                                                           │
│  2. CHECKOUT                                                              │
│     ────────                                                              │
│     📝 Enters:                                                            │
│        • Name: "Rahul Kumar"                                              │
│        • Phone: +91 9876543210                                            │
│        • Address: "123 MG Road, Mumbai"                                   │
│          ↓                                                                │
│     📲 OTP verification (quick sign-in)                                   │
│          ↓                                                                │
│     💳 Chooses payment:                                                   │
│        • UPI → Razorpay checkout                                          │
│        • Card → Razorpay checkout                                         │
│        • COD → Direct confirmation                                        │
│                                                                           │
│  3. ORDER CONFIRMATION                                                    │
│     ──────────────────                                                    │
│     ✅ Order #ABC123 confirmed                                            │
│          ↓                                                                │
│     📲 SMS notification sent                                              │
│          ↓                                                                │
│     📦 Inventory auto-reduced                                             │
│          ↓                                                                │
│     🚚 Delivery agent notified                                            │
│                                                                           │
│  4. TRACK & RECEIVE                                                       │
│     ───────────────                                                       │
│     📍 Real-time tracking link                                            │
│          ↓                                                                │
│     🏍️ "Picked up" notification                                          │
│          ↓                                                                │
│     🏍️ "Out for delivery" notification                                   │
│          ↓                                                                │
│     ✅ "Delivered" - Rate your experience                                 │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flow 3: Delivery Agent

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DELIVERY AGENT JOURNEY                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📱 Login via OTP                                                         │
│       ↓                                                                   │
│  📋 View assigned orders                                                  │
│  ┌─────────────────────────────────────────────────────┐                 │
│  │ Order #123 │ Rahul Kumar │ MG Road │ COD ₹450     │                 │
│  │ [MARK PICKED] [VIEW MAP]                            │                 │
│  └─────────────────────────────────────────────────────┘                 │
│       ↓                                                                   │
│  🏍️ Pick up from store                                                   │
│       ↓                                                                   │
│  📍 One-tap "Picked Up" → Customer notified                              │
│       ↓                                                                   │
│  🗺️ Navigate to customer                                                 │
│       ↓                                                                   │
│  📍 "In Transit" status auto-updated                                      │
│       ↓                                                                   │
│  ✅ Deliver to customer                                                   │
│       ↓                                                                   │
│  💵 If COD: Enter collected amount                                        │
│       ↓                                                                   │
│  📍 "Delivered" → All parties notified                                    │
│       ↓                                                                   │
│  💰 Daily cash summary auto-generated                                     │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

### Authentication APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/otp/request` | Request OTP for phone | Public |
| POST | `/auth/otp/verify` | Verify OTP, get tokens | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| GET | `/auth/profile` | Get user profile | Bearer |

### Store APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/stores/generate` | Generate AI website | Bearer |
| GET | `/stores` | List all stores | Bearer |
| GET | `/stores/{id}` | Get store details | Bearer |
| PUT | `/stores/{id}` | Update store config | Bearer |
| POST | `/stores/{id}/publish` | Publish to production | Bearer |

### Inventory APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/inventory/{storeId}/products` | List products | Bearer |
| POST | `/inventory/{storeId}/products` | Create product | Bearer |
| PUT | `/inventory/{storeId}/products/{id}` | Update product | Bearer |
| DELETE | `/inventory/{storeId}/products/{id}` | Delete product | Bearer |
| PUT | `/inventory/{storeId}/stock/{id}` | Update stock | Bearer |
| GET | `/inventory/{storeId}/low-stock` | Get low stock alerts | Bearer |

### Order APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/orders` | Create new order | Public |
| GET | `/orders/{id}` | Get order details | Public |
| GET | `/stores/{id}/orders` | List store orders | Bearer |
| PUT | `/orders/{id}/status` | Update order status | Bearer |

### Payment APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/create/{orderId}` | Create Razorpay order | Public |
| POST | `/payments/verify` | Verify payment | Public |
| POST | `/payments/webhook` | Razorpay webhook | Signature |

### Delivery APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/delivery/agent/{id}/assignments` | Get agent's orders | Bearer |
| POST | `/delivery/orders/{id}/assign` | Assign to agent | Bearer |
| PUT | `/delivery/{id}/status` | Update delivery status | Bearer |
| GET | `/delivery/{id}/tracking` | Customer tracking | Public |
| POST | `/delivery/{id}/cash` | Record COD collection | Bearer |
| GET | `/delivery/agent/{id}/cash-summary` | Daily cash summary | Bearer |

---

## 🤖 AI Model Fallback Chain

WebDPro uses a **5-level AI fallback system** for maximum reliability:

```
Request: "Generate vegetable store website"
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI FALLBACK CHAIN                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LEVEL 1: Claude 3 Sonnet (PRIMARY)                                      │
│  ────────────────────────────────────                                    │
│  • Best code generation quality                                          │
│  • Cost: $0.003/1K input tokens                                          │
│  • If fails → Try Level 2                                                │
│           │                                                              │
│           ▼                                                              │
│  LEVEL 2: Claude 3 Haiku (FAST)                                          │
│  ──────────────────────────────                                          │
│  • Faster, cheaper                                                       │
│  • Cost: $0.00025/1K input tokens                                        │
│  • If fails → Try Level 3                                                │
│           │                                                              │
│           ▼                                                              │
│  LEVEL 3: Amazon Titan Express                                           │
│  ─────────────────────────────                                           │
│  • Native AWS model                                                      │
│  • Cost: $0.0008/1K input tokens                                         │
│  • If fails → Try Level 4                                                │
│           │                                                              │
│           ▼                                                              │
│  LEVEL 4: Meta Llama 2 70B                                               │
│  ─────────────────────────                                               │
│  • Open source, reliable                                                 │
│  • Cost: $0.00195/1K input tokens                                        │
│  • If fails → Try Level 5                                                │
│           │                                                              │
│           ▼                                                              │
│  LEVEL 5: Rule-Based Generator (OFFLINE)                                 │
│  ────────────────────────────────────────                                │
│  • No AI required                                                        │
│  • Keyword-based templates                                               │
│  • Always works, never fails                                             │
│  • Supports: grocery, restaurant, clinic, fashion, general               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          ✅ Website Generated!
```

### Supported Store Types (Rule-Based)

| Store Type | Keywords | Theme Color | Features |
|------------|----------|-------------|----------|
| Grocery | vegetable, grocery, kirana | 🟢 Green | Same Day Delivery, Farm Fresh |
| Restaurant | restaurant, food, biryani | 🔴 Red | Online Ordering, Quick Delivery |
| Clinic | doctor, clinic, dental | 🔵 Blue | Online Booking, Telemedicine |
| Fashion | clothing, boutique, fashion | 🟣 Purple | Latest Trends, Easy Returns |
| General | (default) | 🔵 Indigo | Fast Deployment, SEO Optimized |

---

## 💾 Database Design

### DynamoDB Tables (7 Total)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DYNAMODB TABLES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  webdpro-tenants          │  webdpro-users                              │
│  ──────────────────       │  ─────────────────                          │
│  PK: tenant_id            │  PK: phone                                  │
│  • business_name          │  • user_id                                  │
│  • plan                   │  • role                                     │
│  • subscription_status    │  • tenant_id                                │
│                           │                                              │
│  webdpro-stores           │  webdpro-products                           │
│  ──────────────────       │  ─────────────────                          │
│  PK: tenant_id            │  PK: store_id                               │
│  SK: store_id             │  SK: product_id                             │
│  • status                 │  • name, price                              │
│  • config                 │  • stock_quantity                           │
│  • live_url               │  • prediction (AI)                          │
│                           │                                              │
│  webdpro-orders           │  webdpro-deliveries                         │
│  ──────────────────       │  ─────────────────                          │
│  PK: order_id             │  PK: agent_id                               │
│  GSI: store_id, tenant_id │  SK: delivery_id                            │
│  • items[]                │  • status                                   │
│  • payment_status         │  • cod_collected                            │
│                           │                                              │
│  webdpro-payments                                                        │
│  ──────────────────                                                      │
│  PK: tenant_id                                                           │
│  SK: payment_id                                                          │
│  • razorpay_order_id                                                     │
│  • status                                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Folder Structure

```
webdproAI/
│
├── 📁 frontend/                    # Landing + Dashboard
│   ├── app/                        # Next.js app router
│   ├── components/                 # React components
│   ├── lib/                        # Utilities
│   └── aws/                        # AWS SDK configs
│
├── 📁 backend/                     # Core API
│   ├── src/handlers/
│   │   ├── auth.ts                 # Cognito OTP
│   │   ├── stores.ts               # AI generation
│   │   ├── orders.ts               # Order management
│   │   └── payments.ts             # Razorpay
│   └── serverless.yml              # Lambda config
│
├── 📁 ai_services/                 # AI Generation
│   └── src/
│       └── bedrock.ts              # Multi-model fallback
│
├── 📁 inventory/                   # Inventory Module
│   ├── src/handlers/
│   │   ├── products.ts             # Product CRUD
│   │   ├── stock.ts                # Stock management
│   │   └── predictions.ts          # AI predictions
│   └── serverless.yml
│
├── 📁 delivery/                    # Delivery Module
│   ├── src/handlers/
│   │   ├── assignments.ts          # Order assignment
│   │   ├── tracking.ts             # Real-time tracking
│   │   └── cash.ts                 # COD management
│   └── serverless.yml
│
├── 📁 docs/                        # Documentation
│   ├── dynamodb-schemas.md         # Database design
│   └── WEBDPRO_COMPLETE_FLOW.md    # This file!
│
└── 📁 infrastructure/              # IaC (future)
    └── main.tf                     # Terraform
```

---

## 🚀 Deployment Guide

### Prerequisites

1. **AWS Account** with Bedrock access enabled
2. **Razorpay Account** for payments
3. **Node.js 18+** installed
4. **AWS CLI** configured

### Step-by-Step Deployment

```bash
# 1. Clone and install
git clone <your-repo>
cd webdproAI
npm install

# 2. Create .env file
cat > .env << EOF
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
COGNITO_USER_POOL_ID=eu-north-1_xxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
S3_BUCKET=webdpro-ai
EOF

# 3. Deploy Backend
cd backend
npm install
npx serverless deploy --stage prod

# 4. Deploy Inventory Module
cd ../inventory
npm install
npx serverless deploy --stage prod

# 5. Deploy Delivery Module
cd ../delivery
npm install
npx serverless deploy --stage prod

# 6. Deploy Frontend (Amplify)
cd ../frontend
npm run build
# Connect to Amplify Console for auto-deploy
```

### AWS Services to Enable

- [ ] AWS Bedrock (request Claude 3 access)
- [ ] Amazon Cognito (create user pool)
- [ ] DynamoDB (tables auto-created)
- [ ] S3 (create bucket: webdpro-ai)
- [ ] CloudFront (optional, for CDN)
- [ ] Route 53 (for custom domain)

---

## 🔮 Future-Proofing Strategy

### Estimated Longevity: **5-7 Years**

| Component | Current | When to Upgrade | Why Still Good |
|-----------|---------|-----------------|----------------|
| **Next.js** | v14 | 2028 (v17+) | React Server Components stable |
| **TypeScript** | v5 | 2029 | Industry standard, growing |
| **DynamoDB** | Current | Never | Serverless, AWS invests heavily |
| **Lambda** | Node 18 | 2026 (Node 22+) | Easy runtime upgrade |
| **Bedrock** | Claude 3 | Auto-updated | AWS adds new models |
| **Razorpay** | v1 API | 2027+ | India-focused, stable |

### Upgrade Recommendations

| Year | Recommended Action |
|------|-------------------|
| **2027** | Upgrade Lambda to Node 20/22 |
| **2028** | Evaluate Next.js 17+ migration |
| **2029** | Consider Bedrock newer models |
| **2030+** | Evaluate new payment providers |

### Architecture Decisions That Ensure Longevity

1. **Serverless-First**: No servers to maintain = no upgrades forced
2. **Multi-Model AI**: If Claude 3 deprecated, auto-fallback works
3. **API Gateway**: Versioning built-in (`/v1/`, `/v2/`)
4. **TypeScript**: Catches issues at compile time
5. **Modular Design**: Replace any module without touching others

---

## 💰 Cost Breakdown

### Monthly Estimated Costs (MVP Traffic)

| Service | Usage | Cost |
|---------|-------|------|
| **AWS Amplify** | Hosting + CI/CD | $3-5 |
| **Lambda** | 100K requests | $0 (free tier) |
| **API Gateway** | 100K requests | $0.35 |
| **DynamoDB** | 5GB storage | $0 (free tier) |
| **S3** | 10GB storage | $0.23 |
| **CloudFront** | 50GB transfer | $4.25 |
| **Bedrock (Claude 3)** | 500 sites/month | $15-25 |
| **Route 53** | 1 hosted zone | $0.50 |
| **Cognito** | 10K users | $0 (free tier) |
| **Total** | | **$25-40/month** |

### Scaling Costs

| Traffic Level | Monthly Cost |
|--------------|--------------|
| 1K stores/month | $50-80 |
| 10K stores/month | $200-300 |
| 100K stores/month | $1,500-2,500 |

### vs. Multi-Cloud Approach

| Approach | Monthly Cost |
|----------|--------------|
| **WebDPro (AWS-Only)** | $25-40 |
| Vercel + Railway + OpenAI | $60-150 |
| **Savings** | **60%+** |

---

## 📞 Support & Next Steps

### To Get Started

1. ✅ Review this document
2. ✅ Set up AWS account in `eu-north-1`
3. ✅ Request Bedrock access (takes 24-48 hours)
4. ✅ Create S3 bucket: `webdpro-ai`
5. ✅ Set up Razorpay account
6. ✅ Deploy using guide above

### Resources

- AWS Bedrock Docs: https://docs.aws.amazon.com/bedrock/
- Razorpay Docs: https://razorpay.com/docs/
- Next.js Docs: https://nextjs.org/docs

---

> **Built with ❤️ for India-scale e-commerce**  
> **Last Updated**: January 2026  
> **Author**: WebDPro AI Team
