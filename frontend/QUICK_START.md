# ⚡ Quick Start - Deploy to AWS Amplify

## 🚀 Deploy in 3 Commands

### 1. Run Deployment Script
```powershell
cd frontend
.\deploy-to-amplify.ps1
```

### 2. Follow Console Instructions
The script will open AWS Amplify Console and guide you through:
- Connecting GitHub
- Configuring build settings
- Adding environment variables

### 3. Update Configuration
After deployment, run:
```powershell
.\update-amplify-url.ps1 -AmplifyUrl "YOUR_AMPLIFY_URL"
```

---

## 📋 What You Need

- ✅ GitHub account (with your code pushed)
- ✅ AWS account (with credentials configured)
- ✅ 15 minutes of time

---

## 🎯 Expected Result

You'll get:
- **Live URL**: `https://main.xxxxxx.amplifyapp.com`
- **Auto-deploy**: Every git push updates your site
- **HTTPS**: Automatic SSL certificate
- **CDN**: Global CloudFront distribution

---

## 📖 Need More Details?

- **Full Guide**: `AMPLIFY_DEPLOYMENT_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Summary**: `../AMPLIFY_DEPLOYMENT_SUMMARY.md`

---

## 🆘 Having Issues?

1. Check build logs in Amplify Console
2. Verify App root is set to `frontend`
3. Ensure all environment variables are added
4. Check the troubleshooting section in the full guide

---

**Let's deploy! 🚀**
