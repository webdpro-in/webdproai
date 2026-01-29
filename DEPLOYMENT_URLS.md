# 🌐 WebDPro Deployment URLs

## 📍 Current Deployment Status

### Backend Services (✅ DEPLOYED)

| Service | URL | Status |
|---------|-----|--------|
| **Main API** | https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev | ✅ Live |
| **AI Services** | https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev | ✅ Live |
| **Inventory** | https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev | ✅ Live |
| **Payments** | https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev | ✅ Live |

### Frontend (🚀 READY TO DEPLOY)

| Environment | URL | Status |
|-------------|-----|--------|
| **Production** | `https://main.xxxxxx.amplifyapp.com` | 🚀 Pending deployment |
| **Local Dev** | http://localhost:3000 | ✅ Available |

### Infrastructure

| Service | Identifier | Region |
|---------|-----------|--------|
| **Cognito User Pool** | eu-north-1_RfO53Cz5t | eu-north-1 |
| **Cognito Client** | 7g6sqvvnqsg628napds0k73190 | eu-north-1 |
| **Cognito Domain** | webdpro-auth-prod-2026 | eu-north-1 |
| **CloudFront** | d3qhkomcxcxmtl.cloudfront.net | Global |
| **S3 Assets** | webdpro-assets-dev | eu-north-1 |

---

## 🚀 Deploy Frontend Now

To deploy the frontend and get your production URL:

```powershell
cd frontend
.\deploy-to-amplify.ps1
```

After deployment, update this file with your Amplify URL!

---

## 📝 Update This File

After deploying to Amplify, update the Frontend section:

```markdown
### Frontend (✅ DEPLOYED)

| Environment | URL | Status |
|-------------|-----|--------|
| **Production** | https://main.xxxxxx.amplifyapp.com | ✅ Live |
| **Local Dev** | http://localhost:3000 | ✅ Available |
```

---

## 🔗 Quick Links

### AWS Consoles
- [Amplify Console](https://console.aws.amazon.com/amplify/)
- [API Gateway](https://console.aws.amazon.com/apigateway/)
- [Cognito](https://console.aws.amazon.com/cognito/)
- [CloudFront](https://console.aws.amazon.com/cloudfront/)
- [S3](https://console.aws.amazon.com/s3/)
- [Lambda](https://console.aws.amazon.com/lambda/)
- [DynamoDB](https://console.aws.amazon.com/dynamodb/)

### Documentation
- [Deployment Guide](frontend/AMPLIFY_DEPLOYMENT_GUIDE.md)
- [Quick Start](frontend/QUICK_START.md)
- [Deployment Summary](AMPLIFY_DEPLOYMENT_SUMMARY.md)

---

## 🎯 Next Steps

1. ✅ Backend deployed and working
2. 🚀 Deploy frontend to Amplify
3. 🔧 Update Cognito callback URLs
4. ✅ Test full application
5. 🌐 Add custom domain (optional)

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CloudFront CDN                       │
│                  (Global Distribution)                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    AWS Amplify                           │
│              (Frontend Hosting - Next.js)                │
│         https://main.xxxxxx.amplifyapp.com              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│              (Backend API Endpoints)                     │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Lambda     │   │   Lambda     │   │   Lambda     │
│  Functions   │   │  Functions   │   │  Functions   │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │   DynamoDB   │
                    │   Tables     │
                    └──────────────┘
```

---

## 🔐 Security

- ✅ All endpoints use HTTPS
- ✅ Cognito authentication enabled
- ✅ API Gateway authorization configured
- ✅ CloudFront with security headers
- ✅ Environment variables secured
- ✅ CORS properly configured

---

## 💰 Cost Tracking

### Current Monthly Estimate:
- **API Gateway**: ~$3-5
- **Lambda**: ~$0-2 (within free tier)
- **DynamoDB**: ~$0-5 (on-demand pricing)
- **S3**: ~$1-2
- **CloudFront**: ~$1-3
- **Cognito**: ~$0 (within free tier)
- **Amplify**: ~$0-10 (after deployment)

**Total Estimated**: $5-30/month

---

## 📈 Monitoring

### CloudWatch Dashboards:
- API Gateway metrics
- Lambda function logs
- DynamoDB performance
- CloudFront analytics

### Amplify Monitoring:
- Build history
- Deployment logs
- Access logs
- Performance metrics

---

*Last updated: January 29, 2026*
*Update this file after deploying frontend!*
