# 🚀 WebDPro Frontend Deployment Checklist

## ✅ Pre-Deployment (DONE)
- [x] `amplify.yml` configuration created
- [x] Environment variables documented
- [x] Build configuration verified
- [x] Next.js config optimized for production

## 📋 Deployment Steps

### Step 1: Push to GitHub
```powershell
cd frontend
.\deploy-to-amplify.ps1
```
Or manually:
```bash
git add .
git commit -m "Deploy frontend to Amplify"
git push origin main
```

### Step 2: AWS Amplify Console Setup
1. Open: https://console.aws.amazon.com/amplify/
2. Region: **eu-north-1** (Stockholm)
3. Click: **New app** → **Host web app**
4. Source: **GitHub**
5. Repository: Your repo
6. Branch: **main**
7. App root: **frontend** ⚠️ IMPORTANT!

### Step 3: Environment Variables
Add these in "Advanced settings":
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
```

### Step 4: Deploy
Click **Save and deploy**

Wait 5-10 minutes for build to complete.

### Step 5: Get Your URL
Your app will be at: `https://main.xxxxxx.amplifyapp.com`

**COPY THIS URL!** You'll need it for the next steps.

---

## 🔧 Post-Deployment Configuration

### Update Cognito Callback URLs
1. Go to: https://console.aws.amazon.com/cognito/
2. Select User Pool: `eu-north-1_RfO53Cz5t`
3. App integration → App clients → Your client
4. Add to **Allowed callback URLs**:
   ```
   https://main.xxxxxx.amplifyapp.com/auth/callback
   ```
5. Add to **Allowed sign-out URLs**:
   ```
   https://main.xxxxxx.amplifyapp.com
   ```
6. Save changes

### Update Amplify Environment Variable
1. Back to Amplify Console
2. Your app → Environment variables
3. Add:
   ```
   NEXT_PUBLIC_APP_URL=https://main.xxxxxx.amplifyapp.com
   ```
4. Save (will trigger auto-redeploy)

---

## ✅ Verification

Test these after deployment:

- [ ] Homepage loads: `https://main.xxxxxx.amplifyapp.com`
- [ ] Login page works: `https://main.xxxxxx.amplifyapp.com/login`
- [ ] Authentication flow completes
- [ ] Dashboard accessible after login
- [ ] API calls work (check browser console)
- [ ] Images load correctly

---

## 🔄 Future Updates

After initial setup, updates are automatic:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main
```

Amplify will automatically:
1. Detect the push
2. Build your app
3. Deploy to production
4. Update your URL

**No manual steps needed!**

---

## 🌐 Custom Domain (Optional)

When ready:
1. Amplify Console → Domain management
2. Add domain
3. Follow DNS setup
4. SSL certificate auto-provisioned

---

## 📊 Monitoring

- **Build logs**: Amplify Console → Your app → Build history
- **Access logs**: CloudWatch Logs
- **Performance**: CloudFront metrics

---

## 🆘 Troubleshooting

### Build Fails
- Check build logs in Amplify Console
- Verify `amplify.yml` is in `frontend/` folder
- Check all env vars are set

### 404 Errors
- Verify App root is set to `frontend`
- Check Next.js routing configuration

### Auth Fails
- Verify Cognito callback URLs
- Check `NEXT_PUBLIC_APP_URL` matches Amplify URL
- Verify all Cognito env vars are correct

### API Errors
- Check CORS settings on backend
- Verify API URLs in env vars
- Check browser console for details

---

## 💰 Cost Estimate

- **Build minutes**: First 1000 free/month, then $0.01/min
- **Hosting**: First 15GB served free, then $0.15/GB
- **Typical cost**: $5-20/month for small apps

---

## 🎯 Success Criteria

✅ Unique HTTPS URL working
✅ Auto-deploy on git push
✅ Authentication working
✅ All API endpoints accessible
✅ Images and assets loading
✅ No console errors

---

**You're ready to deploy! Run the PowerShell script to get started.** 🚀
