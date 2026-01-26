# 🔧 AWS Services Activation Checklist

## ✅ Required AWS Services & Models

### 1. Core Infrastructure Services (Auto-enabled)
```
✅ AWS Lambda - Serverless compute for all business logic
✅ Amazon API Gateway - REST API management and routing
✅ Amazon DynamoDB - NoSQL database for multi-tenant data
✅ Amazon S3 - Object storage for generated websites and assets
✅ Amazon CloudFront - CDN for global content delivery
✅ Amazon SNS - Push notifications and event messaging
✅ Amazon SQS - Message queuing for async processing
✅ Amazon CloudWatch - Monitoring, logging, and alerting
✅ AWS IAM - Identity and access management
✅ AWS CloudFormation - Infrastructure as code (via Serverless)
```

### 2. AI/ML Services (Requires Manual Activation)

#### 🧠 AWS Bedrock Models (CRITICAL - Request Access Required)
```bash
# Go to AWS Bedrock Console > Model access > Request model access

🔴 REQUIRED MODELS:
├── anthropic.claude-3-sonnet-20240229-v1:0    (Primary AI - Best Quality)
├── anthropic.claude-3-haiku-20240307-v1:0     (Fallback AI - Fast)
├── amazon.titan-image-generator-v1             (Image Generation)
├── amazon.titan-express-v1                     (Text Generation)
└── meta.llama2-70b-chat-v1                     (Open Source Fallback)

⚠️  STATUS: Usually approved within 24 hours
⚠️  REGION: Must be enabled in eu-north-1 (Stockholm)
```

#### Check Bedrock Access Status:
```bash
# Verify model access
aws bedrock list-foundation-models --region eu-north-1

# Expected output should include all 5 models above
```

### 3. Authentication Services

#### 🔐 Amazon Cognito User Pool Setup
```bash
# Manual setup required in AWS Console:

1. Go to Amazon Cognito Console
2. Create User Pool
3. Configure:
   ├── Sign-in options: Phone number
   ├── MFA: SMS (required for OTP)
   ├── User attributes: phone_number, custom:tenant_id, custom:role
   ├── App client: Create with no client secret
   └── Domain: Optional custom domain

4. Note down:
   ├── User Pool ID: eu-north-1_XXXXXXXXX
   └── App Client ID: your_client_id_here
```

### 4. Optional Services (For Enhanced Features)

```
🔧 AWS X-Ray - Distributed tracing (optional)
🔧 AWS KMS - Key management for encryption (auto-created)
🔧 Amazon EventBridge - Advanced event routing (optional)
🔧 AWS Systems Manager - Parameter store (optional)
🔧 Amazon Route 53 - DNS management (for custom domains)
```

---

## 🚀 Quick Setup Commands

### 1. Verify AWS CLI Configuration
```bash
# Check current configuration
aws configure list

# Verify region is set to eu-north-1
aws configure get region

# If not set correctly:
aws configure set region eu-north-1
```

### 2. Check Service Availability
```bash
# Test Lambda access
aws lambda list-functions --region eu-north-1

# Test DynamoDB access
aws dynamodb list-tables --region eu-north-1

# Test S3 access
aws s3 ls

# Test Bedrock access (most important)
aws bedrock list-foundation-models --region eu-north-1
```

### 3. Request Bedrock Model Access (CRITICAL)
```bash
# This must be done via AWS Console - cannot be automated
# 1. Go to: https://eu-north-1.console.aws.amazon.com/bedrock/home?region=eu-north-1#/modelaccess
# 2. Click "Request model access"
# 3. Select these models:
#    - Anthropic Claude 3 Sonnet
#    - Anthropic Claude 3 Haiku  
#    - Amazon Titan Image Generator
#    - Amazon Titan Express
#    - Meta Llama 2 70B Chat
# 4. Submit request
# 5. Wait for approval (usually 24 hours)
```

---

## 🔍 Service Limits & Quotas

### Default Limits (can be increased via support ticket):
```
Lambda:
├── Concurrent executions: 1,000
├── Function timeout: 15 minutes
└── Memory: 128 MB - 10,240 MB

DynamoDB:
├── Tables per region: 2,500
├── Read/Write capacity: On-demand (unlimited)
└── Item size: 400 KB max

API Gateway:
├── Requests per second: 10,000
├── Burst limit: 5,000
└── Payload size: 10 MB

Bedrock:
├── Requests per minute: 1,000 (varies by model)
├── Tokens per minute: 100,000 (varies by model)
└── Concurrent requests: 100
```

---

## 💰 Cost Optimization Settings

### 1. DynamoDB Settings
```yaml
# Use On-Demand billing for unpredictable workloads
BillingMode: PAY_PER_REQUEST

# Enable Point-in-Time Recovery (small cost, high value)
PointInTimeRecoveryEnabled: true
```

### 2. Lambda Settings
```yaml
# Right-size memory for cost optimization
memorySize: 
  - 256 MB: Simple CRUD operations
  - 512 MB: API processing
  - 1024 MB: AI generation
  - 2048 MB: Heavy AI processing
```

### 3. S3 Settings
```yaml
# Use Intelligent Tiering for cost optimization
StorageClass: INTELLIGENT_TIERING

# Enable lifecycle policies
LifecycleConfiguration:
  Rules:
    - Status: Enabled
      Transitions:
        - Days: 30
          StorageClass: STANDARD_IA
        - Days: 90
          StorageClass: GLACIER
```

---

## 🧪 Testing Service Connectivity

### 1. Test Script
```bash
#!/bin/bash
echo "🧪 Testing AWS Service Connectivity..."

# Test Lambda
echo "Testing Lambda..."
aws lambda list-functions --region eu-north-1 --max-items 1 > /dev/null && echo "✅ Lambda OK" || echo "❌ Lambda Failed"

# Test DynamoDB
echo "Testing DynamoDB..."
aws dynamodb list-tables --region eu-north-1 > /dev/null && echo "✅ DynamoDB OK" || echo "❌ DynamoDB Failed"

# Test S3
echo "Testing S3..."
aws s3 ls > /dev/null && echo "✅ S3 OK" || echo "❌ S3 Failed"

# Test Bedrock (most important)
echo "Testing Bedrock..."
aws bedrock list-foundation-models --region eu-north-1 > /dev/null && echo "✅ Bedrock OK" || echo "❌ Bedrock Failed"

# Test Cognito
echo "Testing Cognito..."
aws cognito-idp list-user-pools --region eu-north-1 --max-results 1 > /dev/null && echo "✅ Cognito OK" || echo "❌ Cognito Failed"

echo "🏁 Service connectivity test completed!"
```

### 2. PowerShell Version
```powershell
Write-Host "🧪 Testing AWS Service Connectivity..." -ForegroundColor Blue

# Test Lambda
try { aws lambda list-functions --region eu-north-1 --max-items 1 | Out-Null; Write-Host "✅ Lambda OK" -ForegroundColor Green } 
catch { Write-Host "❌ Lambda Failed" -ForegroundColor Red }

# Test DynamoDB
try { aws dynamodb list-tables --region eu-north-1 | Out-Null; Write-Host "✅ DynamoDB OK" -ForegroundColor Green } 
catch { Write-Host "❌ DynamoDB Failed" -ForegroundColor Red }

# Test S3
try { aws s3 ls | Out-Null; Write-Host "✅ S3 OK" -ForegroundColor Green } 
catch { Write-Host "❌ S3 Failed" -ForegroundColor Red }

# Test Bedrock (most important)
try { aws bedrock list-foundation-models --region eu-north-1 | Out-Null; Write-Host "✅ Bedrock OK" -ForegroundColor Green } 
catch { Write-Host "❌ Bedrock Failed - REQUEST MODEL ACCESS!" -ForegroundColor Red }

# Test Cognito
try { aws cognito-idp list-user-pools --region eu-north-1 --max-results 1 | Out-Null; Write-Host "✅ Cognito OK" -ForegroundColor Green } 
catch { Write-Host "❌ Cognito Failed" -ForegroundColor Red }

Write-Host "🏁 Service connectivity test completed!" -ForegroundColor Blue
```

---

## 🚨 Common Issues & Solutions

### 1. Bedrock Access Denied
```
Error: AccessDeniedException: You don't have access to the model

Solution:
1. Go to AWS Bedrock Console
2. Click "Model access" in sidebar
3. Request access to required models
4. Wait for approval (24 hours)
```

### 2. Region Mismatch
```
Error: Model not available in this region

Solution:
1. Ensure all services are in eu-north-1
2. Update AWS CLI: aws configure set region eu-north-1
3. Verify: aws configure get region
```

### 3. IAM Permissions
```
Error: User is not authorized to perform action

Solution:
1. Ensure AWS user has AdministratorAccess policy
2. Or create custom policy with required permissions
3. Verify: aws sts get-caller-identity
```

### 4. Service Limits
```
Error: LimitExceededException

Solution:
1. Check current limits: aws service-quotas list-service-quotas
2. Request limit increase via AWS Support
3. Or optimize resource usage
```

---

## ✅ Final Checklist

Before deploying WebDPro AI, ensure:

- [ ] AWS CLI configured with eu-north-1 region
- [ ] All 5 Bedrock models approved and accessible
- [ ] Cognito User Pool created with phone authentication
- [ ] Razorpay account set up with API keys
- [ ] Hostinger account for domain management (optional)
- [ ] Service connectivity test passed
- [ ] Environment variables configured in .env.local
- [ ] All package dependencies installed

**🎯 Once all items are checked, run `.\quick-deploy.ps1` to deploy the complete platform!**