# Fix Cognito Callback URLs
# This script updates the Cognito User Pool Client with correct callback URLs

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cognito Callback URL Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$UserPoolId = "eu-north-1_twGDpNFjq"
$ClientId = "nijch3h85e0rd6l4a3ppmo25"
$Region = "eu-north-1"

# Callback URLs
$CallbackURLs = @(
    "https://webdpro.in/auth/callback",
    "http://localhost:3000/auth/callback"
)

# Logout URLs
$LogoutURLs = @(
    "https://webdpro.in/login",
    "http://localhost:3000/login"
)

Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Yellow
Write-Host "Client ID: $ClientId" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Check if AWS CLI is installed
Write-Host "Checking AWS CLI..." -ForegroundColor Cyan
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Get current client configuration
Write-Host "Fetching current client configuration..." -ForegroundColor Cyan
try {
    $currentConfig = aws cognito-idp describe-user-pool-client `
        --user-pool-id $UserPoolId `
        --client-id $ClientId `
        --region $Region `
        --output json | ConvertFrom-Json
    
    Write-Host "✓ Current configuration retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current Callback URLs:" -ForegroundColor Yellow
    $currentConfig.UserPoolClient.CallbackURLs | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "Current Logout URLs:" -ForegroundColor Yellow
    $currentConfig.UserPoolClient.LogoutURLs | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch current configuration" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you have run 'aws configure' with correct credentials" -ForegroundColor Yellow
    exit 1
}

# Update client configuration
Write-Host "Updating client configuration..." -ForegroundColor Cyan
Write-Host ""
Write-Host "New Callback URLs:" -ForegroundColor Yellow
$CallbackURLs | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host ""
Write-Host "New Logout URLs:" -ForegroundColor Yellow
$LogoutURLs | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
Write-Host ""

try {
    # Build the update command
    $callbackUrlsJson = $CallbackURLs | ConvertTo-Json -Compress
    $logoutUrlsJson = $LogoutURLs | ConvertTo-Json -Compress
    
    # Update the client
    aws cognito-idp update-user-pool-client `
        --user-pool-id $UserPoolId `
        --client-id $ClientId `
        --region $Region `
        --callback-urls $CallbackURLs `
        --logout-urls $LogoutURLs `
        --allowed-o-auth-flows "code" `
        --allowed-o-auth-scopes "email" "openid" "profile" `
        --allowed-o-auth-flows-user-pool-client `
        --supported-identity-providers "Google" `
        --output json | Out-Null
    
    Write-Host "✓ Client configuration updated successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Failed to update client configuration" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Verify the update
Write-Host "Verifying update..." -ForegroundColor Cyan
try {
    $updatedConfig = aws cognito-idp describe-user-pool-client `
        --user-pool-id $UserPoolId `
        --client-id $ClientId `
        --region $Region `
        --output json | ConvertFrom-Json
    
    Write-Host "✓ Verification complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "Updated Callback URLs:" -ForegroundColor Yellow
    $updatedConfig.UserPoolClient.CallbackURLs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
    Write-Host ""
    Write-Host "Updated Logout URLs:" -ForegroundColor Yellow
    $updatedConfig.UserPoolClient.LogoutURLs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
    Write-Host ""
} catch {
    Write-Host "✗ Failed to verify update" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test local login: http://localhost:3000/login" -ForegroundColor White
Write-Host "2. Test production login: https://webdpro.in/login" -ForegroundColor White
Write-Host "3. Click 'Sign in with Google'" -ForegroundColor White
Write-Host "4. Enter promo code: dprks99" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors, wait 1-2 minutes for AWS to propagate changes." -ForegroundColor Cyan
Write-Host ""
