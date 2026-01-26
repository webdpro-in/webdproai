# AWS Setup Guide for WebDPro

## 1. Configure AWS CLI

Run this command and enter your AWS credentials:

```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: Get from AWS Console > IAM > Users > Your User > Security Credentials
- **AWS Secret Access Key**: Generated with the Access Key
- **Default region**: `eu-north-1` (Stockholm - for GDPR compliance)
- **Default output format**: `json`

## 2. Verify Configuration

Test your setup:
```bash
aws sts get-caller-identity
```

Should return your AWS account details.

## 3. Test Cross-Region Access

```bash
# Test S3 access in eu-north-1
aws s3 ls --region eu-north-1

# Test Bedrock access in us-east-1 (may fail initially - that's normal)
aws bedrock list-foundation-models --region us-east-1
```

## 4. Request Bedrock Model Access

**CRITICAL**: You must request access to AI models in us-east-1:

1. Go to: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
2. Click "Request model access" for these models:
   - ✅ Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
   - ✅ Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0) 
   - ✅ Amazon Titan Text Express (amazon.titan-text-express-v1)
   - ✅ Amazon Titan Image Generator (amazon.titan-image-generator-v1)
   - ✅ Meta Llama 3 70B (meta.llama3-70b-instruct-v1:0)

**Note**: Approval usually takes 24 hours. For immediate testing, we'll use free tier alternatives.

## 5. Get Razorpay Keys (Optional for now)

1. Sign up at https://razorpay.com
2. Go to Dashboard > Settings > API Keys
3. Generate Test Keys (free)
4. Add to .env.local file

## Next Steps

After AWS configuration, run the deployment script:
```bash
.\quick-deploy.ps1
```