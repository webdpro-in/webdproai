# Test Authentication Flow
# This script tests the complete auth flow and identifies issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WebDPro Authentication Flow Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$UserPoolId = "eu-north-1_twGDpNFjq"
$ClientId = "nijch3h85e0rd6l4a3ppmo25"
$Region = "eu-north-1"
$CognitoDomain = "webdpro-auth-prod-2026.auth.eu-north-1.amazoncognito.com"

Write-Host "Testing Configuration:" -ForegroundColor Yellow
Write-Host "  User Pool ID: $UserPoolId"
Write-Host "  Client ID: $ClientId"
Write-Host "  Region: $Region"
Write-Host "  Cognito Domain: $CognitoDomain"
Write-Host ""

# Test 1: Check AWS CLI
Write-Host "[1/6] Checking AWS CLI..." -ForegroundColor Cyan
try {
    $awsVersion = aws --version 2>&1
    Write-Host "  ✓ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ AWS CLI not found" -ForegroundColor Red
    Write-Host "  Install from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Check AWS Credentials
Write-Host "[2/6] Checking AWS Credentials..." -ForegroundColor Cyan
try {
    $identity = aws sts get-caller-identity --output json 2>&1 | ConvertFrom-Json
    Write-Host "  ✓ AWS credentials configured" -ForegroundColor Green
    Write-Host "  Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "  User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ AWS credentials not configured" -ForegroundColor Red
    Write-Host "  Run: aws configure" -ForegroundColor Yellow
    Write-Host "  Access Key: <your-aws-access-key>" -ForegroundColor Yellow
    Write-Host "  Secret Key: <your-aws-secret-key>" -ForegroundColor Yellow
    Write-Host "  Region: eu-north-1" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 3: Check User Pool
Write-Host "[3/6] Checking User Pool..." -ForegroundColor Cyan
try {
    $userPool = aws cognito-idp describe-user-pool `
        --user-pool-id $UserPoolId `
        --region $Region `
        --output json 2>&1 | ConvertFrom-Json
    
    Write-Host "  ✓ User Pool found: $($userPool.UserPool.Name)" -ForegroundColor Green
    Write-Host "  Domain: $($userPool.UserPool.Domain)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ User Pool not found or access denied" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Check App Client Configuration
Write-Host "[4/6] Checking App Client Configuration..." -ForegroundColor Cyan
try {
    $client = aws cognito-idp describe-user-pool-client `
        --user-pool-id $UserPoolId `
        --client-id $ClientId `
        --region $Region `
        --output json 2>&1 | ConvertFrom-Json
    
    Write-Host "  ✓ App Client found: $($client.UserPoolClient.ClientName)" -ForegroundColor Green
    Write-Host ""
    
    # Check Callback URLs
    Write-Host "  Callback URLs:" -ForegroundColor Yellow
    if ($client.UserPoolClient.CallbackURLs) {
        $hasLocalhost = $false
        $hasProduction = $false
        
        foreach ($url in $client.UserPoolClient.CallbackURLs) {
            Write-Host "    - $url" -ForegroundColor White
            if ($url -like "*localhost:3000*") { $hasLocalhost = $true }
            if ($url -like "*webdpro.in*") { $hasProduction = $true }
        }
        
        if ($hasLocalhost -and $hasProduction) {
            Write-Host "  ✓ Both localhost and production URLs configured" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Missing callback URLs" -ForegroundColor Red
            if (-not $hasLocalhost) {
                Write-Host "    Missing: http://localhost:3000/auth/callback" -ForegroundColor Yellow
            }
            if (-not $hasProduction) {
                Write-Host "    Missing: https://webdpro.in/auth/callback" -ForegroundColor Yellow
            }
            Write-Host ""
            Write-Host "  Run: .\fix-cognito-callback-urls.ps1" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  ✗ No callback URLs configured!" -ForegroundColor Red
        Write-Host "  Run: .\fix-cognito-callback-urls.ps1" -ForegroundColor Cyan
    }
    Write-Host ""
    
    # Check Logout URLs
    Write-Host "  Logout URLs:" -ForegroundColor Yellow
    if ($client.UserPoolClient.LogoutURLs) {
        foreach ($url in $client.UserPoolClient.LogoutURLs) {
            Write-Host "    - $url" -ForegroundColor White
        }
    } else {
        Write-Host "  ✗ No logout URLs configured" -ForegroundColor Red
    }
    Write-Host ""
    
    # Check OAuth Settings
    Write-Host "  OAuth Settings:" -ForegroundColor Yellow
    Write-Host "    Grant Types: $($client.UserPoolClient.AllowedOAuthFlows -join ', ')" -ForegroundColor White
    Write-Host "    Scopes: $($client.UserPoolClient.AllowedOAuthScopes -join ', ')" -ForegroundColor White
    Write-Host "    Identity Providers: $($client.UserPoolClient.SupportedIdentityProviders -join ', ')" -ForegroundColor White
    
    if ($client.UserPoolClient.AllowedOAuthFlows -contains "code") {
        Write-Host "  ✓ Authorization code grant enabled" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Authorization code grant not enabled" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  ✗ App Client not found or access denied" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 5: Check Frontend Environment
Write-Host "[5/6] Checking Frontend Environment..." -ForegroundColor Cyan
$envPath = "frontend\.env.local"
if (Test-Path $envPath) {
    Write-Host "  ✓ .env.local found" -ForegroundColor Green
    
    $envContent = Get-Content $envPath -Raw
    
    # Check Cognito variables
    if ($envContent -match "NEXT_PUBLIC_COGNITO_USER_POOL_ID=(.+)") {
        $poolId = $matches[1].Trim()
        if ($poolId -eq $UserPoolId) {
            Write-Host "  ✓ User Pool ID correct: $poolId" -ForegroundColor Green
        } else {
            Write-Host "  ✗ User Pool ID mismatch" -ForegroundColor Red
            Write-Host "    Expected: $UserPoolId" -ForegroundColor Yellow
            Write-Host "    Found: $poolId" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ NEXT_PUBLIC_COGNITO_USER_POOL_ID not found" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXT_PUBLIC_COGNITO_CLIENT_ID=(.+)") {
        $clientId = $matches[1].Trim()
        if ($clientId -eq $ClientId) {
            Write-Host "  ✓ Client ID correct: $clientId" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Client ID mismatch" -ForegroundColor Red
            Write-Host "    Expected: $ClientId" -ForegroundColor Yellow
            Write-Host "    Found: $clientId" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ NEXT_PUBLIC_COGNITO_CLIENT_ID not found" -ForegroundColor Red
    }
    
} else {
    Write-Host "  ✗ .env.local not found" -ForegroundColor Red
    Write-Host "  Create: frontend\.env.local" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Generate Test URLs
Write-Host "[6/6] Generating Test URLs..." -ForegroundColor Cyan
Write-Host ""

$localCallbackUrl = "http://localhost:3000/auth/callback"
$prodCallbackUrl = "https://webdpro.in/auth/callback"

$localAuthUrl = "https://$CognitoDomain/oauth2/authorize?client_id=$ClientId&response_type=code&scope=email+openid+profile&redirect_uri=$([uri]::EscapeDataString($localCallbackUrl))&identity_provider=Google"
$prodAuthUrl = "https://$CognitoDomain/oauth2/authorize?client_id=$ClientId&response_type=code&scope=email+openid+profile&redirect_uri=$([uri]::EscapeDataString($prodCallbackUrl))&identity_provider=Google"

Write-Host "  Local Development Test URL:" -ForegroundColor Yellow
Write-Host "  $localAuthUrl" -ForegroundColor White
Write-Host ""
Write-Host "  Production Test URL:" -ForegroundColor Yellow
Write-Host "  $prodAuthUrl" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. If callback URLs are missing, run:" -ForegroundColor White
Write-Host "   .\fix-cognito-callback-urls.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test login:" -ForegroundColor White
Write-Host "   http://localhost:3000/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Click 'Sign in with Google'" -ForegroundColor White
Write-Host ""
Write-Host "5. Enter promo code: dprks99" -ForegroundColor White
Write-Host ""
Write-Host "If you see 'invalid_request' error, the callback URLs are not configured." -ForegroundColor Yellow
Write-Host "Run the fix script and wait 1-2 minutes for AWS to propagate changes." -ForegroundColor Yellow
Write-Host ""
