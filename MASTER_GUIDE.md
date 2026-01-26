# WebDPro AI - Master Project Guide

## 📂 Perfect Folder Structure

This is how your final project structure looks. Each folder is a separate service.

```text
webdproAI/
├── .env                        # Central environment variables (Sensitive!)
├── package.json                # Root dependencies
├── tsconfig.json               # Root TypeScript config
│
├── frontend/                   # 🌐 NEXT.JS APP (Hosting + Dashboard)
│   ├── app/                    # App Router pages
│   ├── components/             # UI Components
│   └── public/                 # Static assets
│
├── backend/                    # 🔧 CORE API (Lambda + API Gateway)
│   ├── src/
│   │   └── handlers/
│   │       ├── auth.ts         # User Login/Signup
│   │       ├── stores.ts       # Store Management
│   │       ├── orders.ts       # Order Processing
│   │       └── payments.ts     # Razorpay Handling
│   └── serverless.yml          # AWS Deployment Config
│
├── ai_services/                # 🧠 AI ENGINE (Bedrock Pipeline)
│   ├── src/
│   │   ├── pipeline/
│   │   │   ├── 1_spec.ts       # Step 1: Logic (Claude)
│   │   │   ├── 2_code.ts       # Step 2: Code (Claude)
│   │   │   └── 3_images.ts     # Step 3: Images (Titan/SD)
│   │   ├── orchestrator.ts     # Pipeline Manager
│   │   └── bedrock.ts          # AWS Client Wrapper
│   └── serverless.yml          # AI Deployment Config
│
├── inventory/                  # 📦 INVENTORY MICROSERVICE
│   ├── src/handlers/
│   │   ├── products.ts         # Product CRUD
│   │   ├── stock.ts            # Stock Updates
│   │   └── predictions.ts      # AI Stock Predictions
│   └── serverless.yml
│
├── delivery/                   # 🚚 DELIVERY MICROSERVICE
│   ├── src/handlers/
│   │   ├── tracking.ts         # Agent GPS Tracking
│   │   └── assignments.ts      # Order Assignment
│   └── serverless.yml
│
└── docs/                       # 📚 DOCUMENTATION
    ├── WEBDPRO_COMPLETE_FLOW.md
    ├── WEBDPRO_SYSTEM_EXPLAINED.md
    └── dynamodb-schemas.md
```

---

## 🛠 Prerequisites & Requirements

To run this, you need these installed on your Windows machine:

1.  **Node.js 18+**: `node -v`
2.  **AWS CLI v2**: `aws --version` (Configured with `aws configure`)
3.  **Serverless Framework**: `npm install -g serverless`
4.  **Account Access**:
    *   **AWS Account**: With Admin access.
    *   **Razorpay Account**: For payment keys.
    *   **Hostinger Account**: For domain management.

---

## 🔐 The Master `.env` File

Create a file named `.env` in the root `webdproAI/` folder.
**COPY THIS EXACTLY AND FILL IN YOUR KEYS:**

```ini
# ==============================================
# ☁️ AWS CONFIGURATION
# ==============================================
AWS_REGION=eu-north-1
# Your AWS Profile keys (or rely on 'aws configure')
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wkP...

# ==============================================
# 🧠 AI MODEL CONFIGURATION (Bedrock)
# ==============================================
# 1. Primary Model (Logic & Code)
BEDROCK_MODEL_ID_PRIMARY=anthropic.claude-3-sonnet-20240229-v1:0
# 2. Secondary Model (Fallback Logic)
BEDROCK_MODEL_ID_SECONDARY=anthropic.claude-3-haiku-20240307-v1:0
# 3. Image Model (Visuals)
BEDROCK_MODEL_ID_IMAGE=amazon.titan-image-generator-v1
# 4. Fallback Image Model
BEDROCK_MODEL_ID_IMAGE_FALLBACK=stability.stable-diffusion-xl-v1

# ==============================================
# 📦 STORAGE & DATABASE
# ==============================================
# Name of your S3 bucket (Must be unique globally)
S3_BUCKET=webdpro-ai-assets-2026
# Prefix for all DynamoDB tables
DYNAMODB_TABLE_PREFIX=webdpro
# ID of your CloudFront distribution (After you create it)
CLOUDFRONT_DISTRIBUTION_ID=E1XXXXXXXXXX

# ==============================================
# 🔐 AUTHENTICATION (Cognito)
# ==============================================
# User Pool ID for managing users
COGNITO_USER_POOL_ID=eu-north-1_xxxxxxx
# App Client ID for the frontend to connect
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxx

# ==============================================
# 💳 PAYMENTS (Razorpay)
# ==============================================
# Key ID (From Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxx
# Key Secret (Keep this safe!)
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

---

## 📉 AI Fallback Strategy (How it works in code)

The system automatically degrades gracefully if a model fails.

1.  **Spec Generation**:
    *   **Try 1**: Claude 3 Sonnet (Best reasoning).
    *   **Error?** -> **Try 2**: Claude 3 Haiku (Faster).
    *   **Error?** -> **Try 3**: Rule-Based Fallback (Hardcoded templates).

2.  **Image Generation**:
    *   **Try 1**: Amazon Titan Image G1.
    *   **Error?** -> **Try 2**: Placeholders (Service like `placehold.co`).

**You do NOT need to change code.** The `orchestrator.ts` automatically handles these retries. Just ensure your AWS account has access enabled for:
1.  Anthropic Claude 3
2.  Amazon Titan
3.  Stable Diffusion

---

## 🚀 How to make it WORKABLE (Step-by-Step)

1.  **Install Global Deps**:
    ```powershell
    npm install -g serverless typescript
    ```

2.  **Install Project Deps**:
    ```powershell
    cd webdproAI
    # Go into each service and install
    cd backend && npm install
    cd ../ai_services && npm install
    cd ../inventory && npm install
    cd ../delivery && npm install
    ```

3.  **Deploy Databases**:
    Run the script to create DynamoDB tables (see `docs/dynamodb-schemas.md`).

4.  **Deploy Services**:
    ```powershell
    cd backend
    serverless deploy
    
    cd ../ai_services
    serverless deploy
    ```

5.  **Test**:
    Use Postman to call the API Gateway URL returned by `serverless deploy`.
