# Fix AWS Permissions for WebDPro Deployment

## Current Issue
Your AWS user `webdpro-uploader` lacks CloudFormation permissions needed for Serverless deployment.

## Quick Solution (Recommended)

### Step 1: Add Administrator Access
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/home#/users)
2. Click on user: `webdpro-uploader`
3. Click "Add permissions" → "Attach existing policies directly"
4. Search for: `AdministratorAccess`
5. Select it and click "Add permissions"

### Step 2: Retry Deployment
After adding permissions, run:
```bash
.\simple-deploy.ps1
```

## Alternative: Create New User

If you prefer not to modify existing user:

### Step 1: Create New User
1. Go to IAM → Users → "Add user"
2. Username: `webdpro-admin`
3. Access type: "Programmatic access"
4. Permissions: "Attach existing policies directly"
5. Select: `AdministratorAccess`
6. Create user and save the Access Keys

### Step 2: Configure New User
```bash
aws configure
# Enter the new Access Key ID and Secret
# Region: eu-north-1
# Output: json
```

### Step 3: Deploy
```bash
.\simple-deploy.ps1
```

## Security Note
- Administrator access is broad but convenient for development
- For production, use minimal permissions
- You can remove admin access after deployment if needed

## Estimated Time
- Adding permissions: 2 minutes
- Deployment after fix: 5-8 minutes

## Next Steps After Permission Fix
1. Run deployment script
2. Test backend endpoint
3. Deploy AI services
4. Deploy frontend
5. Request Bedrock model access

The deployment should work perfectly once permissions are added!