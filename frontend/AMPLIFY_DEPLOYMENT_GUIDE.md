# AWS Amplify Deployment Guide - WebDPro Frontend

## 🚀 Quick Deploy (Console Method - RECOMMENDED)

Since CLI has network connectivity issues, use the AWS Console method. This is actually better for production!

### Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Prepare for Amplify deployment"
git push origin main
```

### Step 2: Deploy via AWS Amplify Console

1. **Open AWS Amplify Console**
   - Go to: https://console.aws.amazon.com/amplify/
   - Region: `eu-north-1` (Stockholm - same as your backend)

2. **Create New App**
   - Click "New app" → "Host web app"
   - Choose "GitHub" as source
   - Authorize AWS Amplify to access your GitHub

3. **Configure Repository**
   - Select your repository: `webdproAI` (or your repo name)
   - Branch: `main`
   - Click "Next"

4. **Configure Build Settings**
   - App name: `webdpro-frontend`
   - Environment name: `prod`
   - Build settings will auto-detect from `amplify.yml`
   - **IMPORTANT**: Set "App root" to `frontend`

5. **Add Environment Variables**
   Click "Advanced settings" and add these:

   ```
   NEXT_PUBLIC_API_URL=https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev
   NEXT_PUBLIC_AI_URL=https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev
   NEXT_PUBLIC_INVENTORY_URL=https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev
   NEXT_PUBLIC_PAYMENTS_URL=https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev
   NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d3qhkomcxcxmtl.cloudfront.net
   NEXT_PUBLIC_ASSETS_BUCKET=webdpro-assets-dev
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-north-1_RfO53Cz5t
   NEXT_PUBLIC_COGNITO_CLIENT_ID=7g6sqvvnqsg628napds0k73190
   NEXT_PUBLIC_COGNITO_DOMAIN=webdpro-auth-prod-2026
   NEXT_PUBLIC_COGNITO_REGION=eu-north-1
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_A9O3Qt84a8YKnc
   NEXT_PUBLIC_ENABLE_ANALYTICS=false
   NEXT_PUBLIC_ENABLE_CHAT_SUPPORT=false
   ```

6. **Review and Deploy**
   - Review all settings
   - Click "Save and deploy"

### Step 3: Get Your URL

After deployment completes (5-10 minutes):
- Your app will be available at: `https://main.xxxxxx.amplifyapp.com`
- Copy this URL - this is your production frontend!

### Step 4: Update Cognito Callback URLs

Once you have your Amplify URL, update Cognito:

1. Go to AWS Cognito Console
2. Select User Pool: `eu-north-1_RfO53Cz5t`
3. Go to "App integration" → "App clients"
4. Select your app client
5. Add to "Allowed callback URLs":
   ```
   https://main.xxxxxx.amplifyapp.com/auth/callback
   ```
6. Add to "Allowed sign-out URLs":
   ```
   https://main.xxxxxx.amplifyapp.com
   ```

### Step 5: Update Frontend Environment Variable

Update the `NEXT_PUBLIC_APP_URL` in Amplify:
1. Go to Amplify Console → Your app
2. Click "Environment variables"
3. Add/Update:
   ```
   NEXT_PUBLIC_APP_URL=https://main.xxxxxx.amplifyapp.com
   ```
4. Redeploy (Amplify will auto-redeploy)

---

## ✅ What You Get

- **Unique HTTPS URL**: `https://main.xxxxxx.amplifyapp.com`
- **Auto-deploy on Git push**: Every push to `main` triggers deployment
- **CloudFront CDN**: Global edge locations
- **SSL Certificate**: Automatic HTTPS
- **Build logs**: Full visibility into builds
- **Rollback**: Easy rollback to previous versions

---

## 🔄 Auto-Deploy Behavior

After initial setup:
1. Make code changes locally
2. `git push origin main`
3. Amplify automatically:
   - Detects the push
   - Runs `npm install`
   - Runs `npm run build`
   - Deploys to CloudFront
   - Updates your URL

**No manual steps needed!**

---

## 🌐 Custom Domain (Later)

When ready to add your custom domain:
1. Amplify Console → Your app → "Domain management"
2. Click "Add domain"
3. Enter your domain (e.g., `webdpro.com`)
4. Follow DNS configuration steps
5. Amplify handles SSL certificate automatically

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Amplify Console
- Verify all environment variables are set
- Ensure `amplify.yml` is in the `frontend` folder

### App Doesn't Load
- Check browser console for errors
- Verify API URLs are correct
- Check CORS settings on backend APIs

### Authentication Fails
- Verify Cognito callback URLs include Amplify URL
- Check `NEXT_PUBLIC_APP_URL` matches Amplify URL
- Verify Cognito client ID and user pool ID

---

## 📝 Next Steps After Deployment

1. ✅ Copy your Amplify URL
2. ✅ Update Cognito callback URLs
3. ✅ Test authentication flow
4. ✅ Test API connectivity
5. ✅ Add custom domain (optional)
6. ✅ Set up monitoring/alerts

---

## 💡 Pro Tips

- **Branch Deployments**: Create `dev` branch for staging environment
- **Preview Deployments**: Amplify creates preview URLs for PRs
- **Performance**: Amplify automatically optimizes images and assets
- **Monitoring**: Enable CloudWatch logs in Amplify settings
- **Cost**: First 1000 build minutes free, then $0.01/minute

---

## 🔗 Useful Links

- Amplify Console: https://console.aws.amazon.com/amplify/
- Cognito Console: https://console.aws.amazon.com/cognito/
- CloudFront Console: https://console.aws.amazon.com/cloudfront/

---

**Your backend is already deployed and working. Now get your frontend live!** 🚀
