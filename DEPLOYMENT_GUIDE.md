# 🚀 WebDPro AI - Cross-Region Deployment Guide

## ✅ Cross-Region Architecture Overview

**NEW ARCHITECTURE**: WebDPro AI now uses a sophisticated cross-region setup for optimal performance and compliance:

- 🧠 **AI Layer**: AWS Bedrock in `us-east-1` (N. Virginia) - Access to latest Claude Sonnet 4.5 and all AI models
- 🗄️ **Storage Layer**: S3 buckets in `eu-north-1` (Stockholm) - GDPR compliance and European data residency
- 🏢 **Business Logic**: Lambda functions in `eu-north-1` (Stockholm) - Core services and databases
- 🌍 **Cross-Region Traffic**: Optimized for AI processing in US, data storage in EU

**Benefits**:
- ✅ Access to latest AI models (Claude Sonnet 4.5) in us-east-1
- ✅ GDPR compliance with EU data storage
- ✅ Optimized latency for both AI and data operations
- ✅ Cost optimization through intelligent region selection

---

## 🔧 Prerequisites

### 1. Install Required Tools
```powershell
# Node.js 18+ (Check version)
node --version

# Install global dependencies
npm install -g serverless typescript aws-cli

# Verify AWS CLI
aws --version
```

### 2. AWS Account Setup (Multi-Region)
```powershell
# Configure AWS CLI with your credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]  
# Default region name: eu-north-1  # Primary region for business logic
# Default output format: json

# Verify configuration
aws sts get-caller-identity

# Test cross-region access
aws bedrock list-foundation-models --region us-east-1
aws s3 ls --region eu-north-1
```

---

## 🏗️ AWS Services to Activate (Cross-Region)

### 1. Core Services in eu-north-1 (Stockholm)
```bash
✅ AWS Lambda (Business logic)
✅ API Gateway (REST APIs)
✅ DynamoDB (Multi-tenant database)
✅ S3 (Website and asset storage)
✅ CloudFront (Global CDN)
✅ SNS/SQS (Event messaging)
✅ CloudWatch (Monitoring)
✅ Cognito (Authentication)
```

### 2. AI Services in us-east-1 (N. Virginia) - CRITICAL
```bash
# AWS Bedrock Models - Request Access in us-east-1:
🧠 anthropic.claude-3-5-sonnet-20241022-v2:0    (PRIMARY - Latest Claude)
🧠 anthropic.claude-3-haiku-20240307-v1:0       (Fallback 1 - Fast)
🧠 amazon.titan-text-express-v1                 (Fallback 2 - AWS Native)
🧠 amazon.titan-image-generator-v1              (Image generation)
🧠 meta.llama3-70b-instruct-v1:0               (Fallback 3 - Open source)

# IMPORTANT: Request access in us-east-1 region specifically!
# 1. Go to AWS Bedrock Console in us-east-1
# 2. Click "Model access" in left sidebar
# 3. Request access to all models above
# 4. Wait for approval (usually 24 hours)
```

### 3. Cross-Region Permissions
```bash
# Your AWS user/role needs permissions for:
✅ Bedrock access in us-east-1
✅ S3 access in eu-north-1
✅ Lambda/DynamoDB access in eu-north-1
✅ Cross-region data transfer permissions
```

---

## 📦 Step-by-Step Cross-Region Deployment

### Step 1: Environment Setup
```powershell
# Clone/navigate to project directory
cd webdpro-ai

# Copy environment template
copy .env.template .env.local

# Edit .env.local with cross-region configuration:
AWS_S3_REGION=eu-north-1
AWS_S3_BUCKET=webdpro-ai-storage
AWS_S3_BUCKET_WEBSITES=webdpro-websites
AWS_S3_BUCKET_ASSETS=webdpro-assets

AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_PRIMARY=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_BEDROCK_MODEL_FALLBACK_1=anthropic.claude-3-haiku-20240307-v1:0
AWS_BEDROCK_MODEL_FALLBACK_2=amazon.titan-text-express-v1
AWS_BEDROCK_MODEL_IMAGE=amazon.titan-image-generator-v1
AWS_BEDROCK_MODEL_FALLBACK_3=meta.llama3-70b-instruct-v1:0

AWS_CORE_REGION=eu-north-1
```

### Step 2: Install Dependencies
```powershell
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# AI Services dependencies  
cd ai_services && npm install && cd ..

# Inventory dependencies
cd inventory && npm install && cd ..

# Delivery dependencies
cd delivery && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Step 3: Deploy Cross-Region Services
```powershell
# 1. Deploy Backend (Creates DynamoDB in eu-north-1, S3 buckets)
cd backend
npx serverless deploy --stage dev
# ✅ Note the API Gateway URL from output
cd ..

# 2. Deploy AI Services (Cross-region: Bedrock us-east-1 + S3 eu-north-1)
cd ai_services  
npx serverless deploy --stage dev
# ✅ Note the AI Service URL from output
cd ..

# 3. Deploy Inventory Service (eu-north-1)
cd inventory
npx serverless deploy --stage dev
cd ..

# 4. Deploy Delivery Service (eu-north-1)
cd delivery
npx serverless deploy --stage dev
cd ..
```

### Step 4: Verify Cross-Region Setup
```powershell
# Test Bedrock access in us-east-1
aws bedrock list-foundation-models --region us-east-1

# Test S3 buckets in eu-north-1
aws s3 ls --region eu-north-1

# Test cross-region AI generation
curl -X POST https://your-ai-url/dev/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a vegetable store for Mumbai"}'
```

---

## 🔑 Required API Keys & Cross-Region Configurations

### 1. AWS Bedrock Model Access (us-east-1)
```bash
# CRITICAL: Request access in us-east-1 region specifically
# Go to: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess

# Required models:
- Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
- Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)
- Amazon Titan Text Express (amazon.titan-text-express-v1)
- Amazon Titan Image Generator (amazon.titan-image-generator-v1)
- Meta Llama 3 70B (meta.llama3-70b-instruct-v1:0)

# Verify access:
aws bedrock list-foundation-models --region us-east-1 | grep -E "(claude|titan|llama)"
```

### 2. S3 Bucket Configuration (eu-north-1)
```bash
# Three buckets will be created in eu-north-1:
- webdpro-ai-storage-dev (Generated content)
- webdpro-websites-dev (Published websites)
- webdpro-assets-dev (Images and static files)

# Verify buckets:
aws s3 ls --region eu-north-1 | grep webdpro
```

### 3. Cross-Region IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::webdpro-*",
        "arn:aws:s3:::webdpro-*/*"
      ]
    }
  ]
}
```

---

## 🧪 Testing Cross-Region Architecture

### 1. Test AI Generation (us-east-1 → eu-north-1)
```powershell
# Test the complete cross-region flow
curl -X POST https://your-ai-url/dev/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a modern vegetable store for Mumbai with green theme",
    "businessType": "grocery",
    "location": "Mumbai, India"
  }'

# Expected flow:
# 1. Request received in eu-north-1 (Lambda)
# 2. AI processing in us-east-1 (Bedrock)
# 3. Website stored in eu-north-1 (S3)
# 4. Response with S3 URLs in eu-north-1
```

### 2. Verify Cross-Region Latency
```bash
# Monitor CloudWatch logs for timing:
# - Bedrock call latency (us-east-1)
# - S3 upload latency (eu-north-1)
# - Total cross-region processing time

# Expected latencies:
# - Bedrock generation: 2-10 seconds
# - Cross-region data transfer: 100-300ms
# - S3 storage: 50-200ms
# - Total: 3-12 seconds
```

---

## 🚀 Automated Cross-Region Deployment

Use the updated PowerShell script:

```powershell
# Run the cross-region deployment
.\quick-deploy.ps1 -Stage dev

# The script will:
# 1. Verify cross-region permissions
# 2. Deploy services in correct order
# 3. Test cross-region connectivity
# 4. Provide service URLs and test commands
```

---

## 📊 Cross-Region Service URLs

After deployment, you'll have these endpoints:

### Backend Service (eu-north-1)
```
https://your-backend-id.execute-api.eu-north-1.amazonaws.com/dev
├── POST /auth/otp/request
├── POST /auth/otp/verify
├── POST /stores/generate (triggers cross-region AI)
├── GET  /stores
├── POST /orders
└── POST /payments/create/{orderId}
```

### AI Service (eu-north-1 business logic, us-east-1 AI processing)
```
https://your-ai-id.execute-api.eu-north-1.amazonaws.com/dev
├── POST /ai/generate (Bedrock us-east-1 → S3 eu-north-1)
├── POST /ai/spec (Claude 3.5 Sonnet in us-east-1)
├── POST /ai/code (AI generation in us-east-1)
└── POST /ai/images (Titan Image in us-east-1 → S3 eu-north-1)
```

### Storage URLs (eu-north-1)
```
Generated Websites: https://webdpro-websites-dev.s3.eu-north-1.amazonaws.com/
Static Assets: https://webdpro-assets-dev.s3.eu-north-1.amazonaws.com/
AI Content: https://webdpro-ai-storage-dev.s3.eu-north-1.amazonaws.com/
```

---

## 💰 Cross-Region Cost Estimation

**Monthly costs for moderate usage (1000 users, 100 stores):**

**EU Region (eu-north-1):**
- Lambda: ~$20/month
- DynamoDB: ~$25/month  
- S3: ~$10/month
- API Gateway: ~$15/month
- CloudFront: ~$5/month
- SNS/SQS: ~$5/month

**US Region (us-east-1):**
- **Bedrock AI**: ~$60/month (Claude 3.5 Sonnet premium pricing)
- **Cross-region data transfer**: ~$10/month

**Total**: ~$150/month (20% increase for premium AI models and cross-region setup)

---

## 🔍 Cross-Region Troubleshooting

### Common Issues:

1. **Bedrock Access Denied in us-east-1**
   ```bash
   # Solution: Ensure model access requested in us-east-1 specifically
   # Check: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
   ```

2. **Cross-Region Latency Issues**
   ```bash
   # Monitor CloudWatch logs for timing
   # Expected: 100-300ms additional latency for cross-region calls
   # If higher: Check network connectivity and AWS service health
   ```

3. **S3 Bucket Access Issues**
   ```bash
   # Verify buckets exist in eu-north-1
   aws s3 ls --region eu-north-1 | grep webdpro
   
   # Check bucket policies allow cross-region access
   aws s3api get-bucket-policy --bucket webdpro-ai-storage-dev --region eu-north-1
   ```

4. **Environment Variable Mismatch**
   ```bash
   # Ensure all services use correct regions:
   AWS_BEDROCK_REGION=us-east-1
   AWS_S3_REGION=eu-north-1
   AWS_CORE_REGION=eu-north-1
   ```

---

## ✅ Cross-Region Success Checklist

- [ ] AWS CLI configured with eu-north-1 as default region
- [ ] Bedrock model access approved in us-east-1 for all 5 models
- [ ] S3 buckets created and accessible in eu-north-1
- [ ] Cross-region IAM permissions configured
- [ ] All 4 backend services deployed successfully
- [ ] Cross-region AI generation tested and working
- [ ] Website storage in eu-north-1 verified
- [ ] End-to-end cross-region flow tested
- [ ] Latency and performance acceptable

---

**🎉 Congratulations! Your WebDPro AI platform now runs on a sophisticated cross-region architecture with the latest AI models and GDPR-compliant data storage!**

**Architecture Summary:**
- 🧠 **AI Processing**: Claude 3.5 Sonnet in us-east-1 for best quality
- 🗄️ **Data Storage**: All websites and user data in eu-north-1 for GDPR compliance
- ⚡ **Performance**: Optimized cross-region communication with <300ms overhead
- 🔒 **Security**: Enterprise-grade isolation with cross-region encryption