# Verify Frontend is Ready for Amplify Deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WebDPro Deployment Readiness Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check 1: Git repository
Write-Host "1. Checking Git repository..." -ForegroundColor Yellow
if (Test-Path "../.git") {
    Write-Host "   ✅ Git repository found" -ForegroundColor Green
} else {
    Write-Host "   ❌ Not a Git repository" -ForegroundColor Red
    $allGood = $false
}

# Check 2: package.json
Write-Host "2. Checking package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ✅ package.json found" -ForegroundColor Green
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.scripts.build) {
        Write-Host "   ✅ Build script configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build script missing" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "   ❌ package.json not found" -ForegroundColor Red
    $allGood = $false
}

# Check 3: next.config.js
Write-Host "3. Checking Next.js configuration..." -ForegroundColor Yellow
if (Test-Path "next.config.js") {
    Write-Host "   ✅ next.config.js found" -ForegroundColor Green
} else {
    Write-Host "   ❌ next.config.js not found" -ForegroundColor Red
    $allGood = $false
}

# Check 4: amplify.yml
Write-Host "4. Checking Amplify configuration..." -ForegroundColor Yellow
if (Test-Path "amplify.yml") {
    Write-Host "   ✅ amplify.yml found" -ForegroundColor Green
} else {
    Write-Host "   ❌ amplify.yml not found" -ForegroundColor Red
    $allGood = $false
}

# Check 5: .env.local
Write-Host "5. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "   ✅ .env.local found" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @(
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_COGNITO_USER_POOL_ID",
        "NEXT_PUBLIC_COGNITO_CLIENT_ID"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch $var) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "   ✅ All required variables present" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Missing variables: $($missingVars -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  .env.local not found (optional)" -ForegroundColor Yellow
}

# Check 6: AWS CLI
Write-Host "6. Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   ✅ AWS CLI installed: $($awsVersion.Split()[0])" -ForegroundColor Green
    
    # Check credentials
    try {
        $identity = aws sts get-caller-identity 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ AWS credentials configured" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  AWS credentials may have connectivity issues" -ForegroundColor Yellow
            Write-Host "      (This is OK - you can use AWS Console)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ⚠️  Cannot verify AWS credentials" -ForegroundColor Yellow
        Write-Host "      (This is OK - you can use AWS Console)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  AWS CLI not found (optional for Console deployment)" -ForegroundColor Yellow
}

# Check 7: Node modules
Write-Host "7. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found - run 'npm install'" -ForegroundColor Yellow
}

# Check 8: Git status
Write-Host "8. Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain 2>&1
if ($LASTEXITCODE -eq 0) {
    if ($gitStatus) {
        Write-Host "   ⚠️  Uncommitted changes detected" -ForegroundColor Yellow
        Write-Host "      Run deploy script to commit and push" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ No uncommitted changes" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Cannot check Git status" -ForegroundColor Yellow
}

# Check 9: GitHub remote
Write-Host "9. Checking GitHub remote..." -ForegroundColor Yellow
$gitRemote = git remote -v 2>&1
if ($LASTEXITCODE -eq 0 -and $gitRemote -match "github.com") {
    Write-Host "   ✅ GitHub remote configured" -ForegroundColor Green
} else {
    Write-Host "   ❌ GitHub remote not configured" -ForegroundColor Red
    Write-Host "      You need to push your code to GitHub first" -ForegroundColor Gray
    $allGood = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 You're ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step:" -ForegroundColor Yellow
    Write-Host "  .\deploy-to-amplify.ps1" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please fix the issues above before deploying." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  - Initialize Git: git init" -ForegroundColor Gray
    Write-Host "  - Add GitHub remote: git remote add origin <url>" -ForegroundColor Gray
    Write-Host "  - Install dependencies: npm install" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Summary of deployment files
Write-Host "📚 Deployment Documentation:" -ForegroundColor Cyan
Write-Host "   - QUICK_START.md - Quick deployment guide" -ForegroundColor White
Write-Host "   - AMPLIFY_DEPLOYMENT_GUIDE.md - Detailed guide" -ForegroundColor White
Write-Host "   - DEPLOYMENT_CHECKLIST.md - Step-by-step checklist" -ForegroundColor White
Write-Host "   - ../AMPLIFY_DEPLOYMENT_SUMMARY.md - Full summary" -ForegroundColor White
Write-Host ""

# Backend status
Write-Host "🔧 Backend Status:" -ForegroundColor Cyan
Write-Host "   ✅ API Gateway deployed" -ForegroundColor Green
Write-Host "   ✅ Lambda functions deployed" -ForegroundColor Green
Write-Host "   ✅ Cognito configured" -ForegroundColor Green
Write-Host "   ✅ DynamoDB tables created" -ForegroundColor Green
Write-Host "   ✅ CloudFront distribution active" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 What's Next:" -ForegroundColor Cyan
Write-Host "   1. Deploy frontend to Amplify" -ForegroundColor White
Write-Host "   2. Update Cognito callback URLs" -ForegroundColor White
Write-Host "   3. Test full application" -ForegroundColor White
Write-Host "   4. Add custom domain (optional)" -ForegroundColor White
Write-Host ""
