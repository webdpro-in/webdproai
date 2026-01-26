# 🚀 WebDPro AI - Complete Deployment Instructions

## Current Status
✅ Project analyzed and optimized for free tier  
✅ Deployment scripts created  
✅ Fallback AI system implemented (works without Bedrock approval)  
✅ AWS CLI installed  
❌ AWS credentials need configuration  

## Step-by-Step Deployment

### 1. Configure AWS Credentials
```bash
aws configure
```
Enter your AWS credentials:
- **AWS Access Key ID**: From AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Generated with Access Key
- **Default region**: `eu-north-1` (Stockholm)
- **Default output format**: `json`

### 2. Verify AWS Configuration
```bash
aws sts get-caller-identity
```
Should show your AWS account details.

### 3. Deploy WebDPro Services
```bash
.\free-tier-deploy.ps1
```

This will:
- Deploy Backend API (Cognito, DynamoDB, Lambda)
- Deploy AI Services (with fallback support)
- Deploy Inventory Service
- Deploy Delivery Service
- Create S3 buckets
- Update environment variables automatically

### 4. Test Deployment
```bash
.\test-deployment.ps1
```

This will:
- Test all API endpoints
- Generate a sample website
- Verify database tables
- Check S3 buckets

### 5. Deploy Frontend (Optional)
```bash
cd frontend
npm install
npm run build
```

Deploy to Vercel/Netlify for free hosting.

## Free Tier Optimizations Applied

### Lambda Functions
- **Memory**: 128-256MB (instead of 512-1024MB)
- **Timeout**: 15-60s (instead of 30-300s)
- **Concurrent executions**: Within free tier limits

### DynamoDB
- **Billing**: Pay-per-request (free tier friendly)
- **Read/Write**: 25 GB storage + 25 RCU/WCU free

### S3 Storage
- **Storage**: 5GB free tier
- **Requests**: 20,000 GET + 2,000 PUT free

### AI Services
- **Primary**: AWS Bedrock (when approved)
- **Fallback**: Template-based generation (always works)
- **Images**: Free placeholder service

## Expected Costs

**Free Tier (First 12 months):**
- Lambda: $0 (1M requests free)
- DynamoDB: $0 (25GB + 25 RCU/WCU free)
- S3: $0 (5GB storage free)
- API Gateway: $0 (1M requests free)

**After Free Tier:**
- Estimated: $5-15/month for moderate usage
- Bedrock AI: $0.003 per 1K tokens (very affordable)

## Troubleshooting

### "Bedrock Access Denied"
- This is normal initially
- Fallback system will work
- Request model access: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess

### "Deployment Failed"
- Check AWS credentials: `aws sts get-caller-identity`
- Ensure sufficient permissions
- Try deploying services individually

### "AI Generation Failed"
- Fallback system should work automatically
- Check test-generated-website.html for output
- Bedrock approval takes 24 hours

## Next Steps After Deployment

1. **Request Bedrock Access** (for full AI features)
2. **Get Razorpay Keys** (for payments)
3. **Deploy Frontend** (Vercel/Netlify)
4. **Custom Domain** (optional)
5. **SSL Certificate** (free with CloudFront)

## Support

If you encounter issues:
1. Check the generated log files
2. Run `.\test-deployment.ps1` for diagnostics
3. Verify AWS permissions
4. Ensure all environment variables are set

---

**Ready to deploy? Run: `aws configure` then `.\free-tier-deploy.ps1`**