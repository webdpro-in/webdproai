# Network Connectivity Fix Guide

## Problem
You're experiencing DNS resolution failures preventing AWS deployment:
- Error: `Inaccessible host: apigateway.eu-north-1.amazonaws.com`
- Error: `Name resolution of apigateway.eu-north-1.amazonaws.com failed`
- Error: `502 Bad Gateway` from API Gateway endpoints

## Root Cause
Your local DNS servers cannot resolve AWS domain names. This is commonly caused by:
1. ISP DNS servers blocking/not resolving AWS domains
2. Corporate firewall/proxy blocking AWS
3. Antivirus software interfering with DNS
4. Corrupted DNS cache

## Solutions (Try in Order)

### Solution 1: Change DNS to Google DNS (RECOMMENDED)

**Step 1: Run PowerShell as Administrator**
- Press `Win + X`
- Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

**Step 2: Find your active network adapter**
```powershell
Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
```

**Step 3: Change DNS for all active adapters**
```powershell
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ("8.8.8.8","8.8.4.4")
}
```

**Step 4: Flush DNS cache**
```powershell
ipconfig /flushdns
ipconfig /registerdns
```

**Step 5: Test connectivity**
```powershell
Test-NetConnection -ComputerName apigateway.eu-north-1.amazonaws.com -Port 443
```

If successful, you should see `TcpTestSucceeded : True`

---

### Solution 2: Use Cloudflare DNS (Alternative)

```powershell
# Run as Administrator
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ("1.1.1.1","1.0.0.1")
}
ipconfig /flushdns
```

---

### Solution 3: Check Firewall/Antivirus

**Windows Firewall:**
1. Open Windows Security
2. Go to "Firewall & network protection"
3. Click "Allow an app through firewall"
4. Temporarily disable to test (not recommended for production)

**Antivirus:**
- Temporarily disable antivirus software
- Add exceptions for:
  - `*.amazonaws.com`
  - `*.execute-api.eu-north-1.amazonaws.com`
  - Node.js executable
  - Serverless Framework

---

### Solution 4: Configure Proxy (If on Corporate Network)

**Check if proxy is configured:**
```powershell
netsh winhttp show proxy
```

**If proxy is set, configure for AWS:**
```powershell
# Set environment variables (replace with your proxy details)
$env:HTTP_PROXY = "http://proxy-server:port"
$env:HTTPS_PROXY = "http://proxy-server:port"
$env:NO_PROXY = "localhost,127.0.0.1"

# For AWS CLI
aws configure set proxy.http http://proxy-server:port
aws configure set proxy.https http://proxy-server:port
```

---

### Solution 5: Use Mobile Hotspot (Quick Test)

If you're on a corporate network that blocks AWS:
1. Enable mobile hotspot on your phone
2. Connect your computer to the hotspot
3. Try deployment again

This helps identify if the issue is network-specific.

---

### Solution 6: Reset Network Stack (Last Resort)

```powershell
# Run as Administrator
netsh winsock reset
netsh int ip reset
ipconfig /release
ipconfig /renew
ipconfig /flushdns
```

**Restart your computer after running these commands.**

---

## Verification Steps

### 1. Test DNS Resolution
```powershell
# Should return IP addresses
Resolve-DnsName apigateway.eu-north-1.amazonaws.com
Resolve-DnsName lambda.eu-north-1.amazonaws.com
Resolve-DnsName s3.eu-north-1.amazonaws.com
```

### 2. Test HTTPS Connectivity
```powershell
Test-NetConnection -ComputerName apigateway.eu-north-1.amazonaws.com -Port 443
Test-NetConnection -ComputerName 7ix42khff8.execute-api.eu-north-1.amazonaws.com -Port 443
```

### 3. Test AWS CLI
```powershell
aws sts get-caller-identity
```

Should return your AWS account details without errors.

### 4. Run Connectivity Test Script
```powershell
cd backend
.\fix-dns.ps1
```

---

## After Network is Fixed

### 1. Redeploy Backend
```powershell
cd backend
npm run deploy
```

### 2. Verify Deployment
```powershell
serverless info
```

### 3. Test API Endpoints
```powershell
# Test health check (should return 403 or 401, not DNS error)
curl https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev/stores
```

---

## Common Issues After DNS Fix

### Issue: Still getting 502 Bad Gateway

**Cause:** Lambda function errors or timeouts

**Solution:**
1. Check CloudWatch Logs:
   ```powershell
   aws logs tail /aws/lambda/webdpro-backend-dev-generateStore --follow
   ```

2. Check Lambda function configuration:
   - Memory: Should be at least 512 MB for generateStore
   - Timeout: Should be at least 29 seconds
   - Environment variables: All required vars set

3. Redeploy with verbose logging:
   ```powershell
   cd backend
   serverless deploy --verbose
   ```

### Issue: 401 Unauthorized

**Cause:** Missing or invalid authentication token

**Solution:**
1. Ensure you're sending Authorization header
2. Token should be valid Cognito JWT
3. Check Cognito User Pool configuration

### Issue: CORS errors in browser

**Cause:** Gateway Responses not deployed

**Solution:**
The CORS fixes in `backend/serverless.yml` should resolve this after deployment.

---

## Quick Reference Commands

```powershell
# Change DNS to Google
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ("8.8.8.8","8.8.4.4")
}

# Flush DNS
ipconfig /flushdns

# Test AWS connectivity
Test-NetConnection -ComputerName apigateway.eu-north-1.amazonaws.com -Port 443

# Deploy backend
cd backend
npm run deploy

# Check logs
aws logs tail /aws/lambda/webdpro-backend-dev-generateStore --follow
```

---

## Need More Help?

1. **Run diagnostic script:**
   ```powershell
   cd backend
   .\fix-dns.ps1
   ```

2. **Check AWS Service Health:**
   - Visit: https://health.aws.amazon.com/health/status
   - Check eu-north-1 region status

3. **Contact Network Administrator:**
   - If on corporate network, ask about AWS domain whitelisting
   - Request access to `*.amazonaws.com`

4. **Alternative Deployment Methods:**
   - Use AWS Console to deploy manually
   - Use AWS CloudShell (browser-based)
   - Deploy from a different network

---

## Success Indicators

✅ DNS resolution works: `Resolve-DnsName apigateway.eu-north-1.amazonaws.com` returns IPs  
✅ HTTPS connectivity works: `Test-NetConnection` shows `TcpTestSucceeded : True`  
✅ AWS CLI works: `aws sts get-caller-identity` returns account info  
✅ Deployment succeeds: `serverless deploy` completes without errors  
✅ API responds: `curl` to API Gateway returns 200/401/403 (not DNS errors)  

---

## Prevention for Future

1. **Use Google DNS permanently** (8.8.8.8, 8.8.4.4)
2. **Whitelist AWS domains** in firewall/antivirus
3. **Configure proxy** if on corporate network
4. **Keep AWS CLI updated**: `pip install --upgrade awscli`
5. **Monitor AWS Service Health**: Subscribe to AWS Health Dashboard

---

**Last Updated:** 2026-01-28  
**Tested On:** Windows 11, PowerShell 7.x
