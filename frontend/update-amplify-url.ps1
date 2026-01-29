# Script to update configuration after getting Amplify URL

param(
    [Parameter(Mandatory=$true)]
    [string]$AmplifyUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Update WebDPro with Amplify URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate URL format
if ($AmplifyUrl -notmatch "^https://.*\.amplifyapp\.com$") {
    Write-Host "❌ Invalid Amplify URL format." -ForegroundColor Red
    Write-Host "   Expected format: https://main.xxxxxx.amplifyapp.com" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Valid Amplify URL: $AmplifyUrl" -ForegroundColor Green
Write-Host ""

# Update .env.local
Write-Host "📝 Updating .env.local..." -ForegroundColor Cyan
$envPath = ".env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace 'NEXT_PUBLIC_APP_URL="[^"]*"', "NEXT_PUBLIC_APP_URL=`"$AmplifyUrl`""
    Set-Content $envPath $envContent
    Write-Host "✅ Updated .env.local" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Update Cognito Callback URLs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Go to AWS Cognito Console:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/cognito/" -ForegroundColor Cyan
Write-Host ""
Write-Host "   User Pool: eu-north-1_RfO53Cz5t" -ForegroundColor White
Write-Host "   App integration → App clients → Your client" -ForegroundColor White
Write-Host ""
Write-Host "   Add to Allowed callback URLs:" -ForegroundColor White
Write-Host "   $AmplifyUrl/auth/callback" -ForegroundColor Green
Write-Host ""
Write-Host "   Add to Allowed sign-out URLs:" -ForegroundColor White
Write-Host "   $AmplifyUrl" -ForegroundColor Green
Write-Host ""

Write-Host "2️⃣  Update Amplify Environment Variable:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Go to Amplify Console:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/amplify/" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Your app → Environment variables → Add variable:" -ForegroundColor White
Write-Host "   Key: NEXT_PUBLIC_APP_URL" -ForegroundColor White
Write-Host "   Value: $AmplifyUrl" -ForegroundColor Green
Write-Host ""
Write-Host "   Save (this will trigger a redeploy)" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Test Your Application:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Homepage: $AmplifyUrl" -ForegroundColor Cyan
Write-Host "   Login: $AmplifyUrl/login" -ForegroundColor Cyan
Write-Host "   Dashboard: $AmplifyUrl/dashboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Configuration Updated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to open consoles
$openCognito = Read-Host "Open Cognito Console to update callback URLs? (y/n)"
if ($openCognito -eq "y") {
    Start-Process "https://console.aws.amazon.com/cognito/v2/idp/user-pools/eu-north-1_RfO53Cz5t/app-integration/clients"
}

$openAmplify = Read-Host "Open Amplify Console to update environment variables? (y/n)"
if ($openAmplify -eq "y") {
    Start-Process "https://console.aws.amazon.com/amplify/"
}

Write-Host ""
Write-Host "🎉 All set! Your frontend is ready to go live!" -ForegroundColor Green
