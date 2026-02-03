# WebDPro Frontend - AWS Amplify Deployment Script
# This script helps prepare and guide you through Amplify deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WebDPro Frontend - Amplify Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository root. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git repository detected" -ForegroundColor Green
Write-Host ""

# Check if there are uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""
    
    $commit = Read-Host "Do you want to commit and push these changes? (y/n)"
    if ($commit -eq "y") {
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Prepare frontend for Amplify deployment"
        }
        
        Write-Host "📦 Adding files..." -ForegroundColor Cyan
        git add .
        
        Write-Host "💾 Committing..." -ForegroundColor Cyan
        git commit -m $commitMessage
        
        Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to push to GitHub. Please check your git configuration." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps - AWS Amplify Console" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Open AWS Amplify Console:" -ForegroundColor Yellow
Write-Host "   https://console.aws.amazon.com/amplify/" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Click 'New app' → 'Host web app'" -ForegroundColor Yellow
Write-Host ""

Write-Host "3️⃣  Connect GitHub repository" -ForegroundColor Yellow
Write-Host "   - Authorize AWS Amplify" -ForegroundColor White
Write-Host "   - Select your repository" -ForegroundColor White
Write-Host "   - Branch: main" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  Configure build settings:" -ForegroundColor Yellow
Write-Host "   - App name: webdpro-frontend" -ForegroundColor White
Write-Host "   - Environment: prod" -ForegroundColor White
Write-Host "   - App root: frontend" -ForegroundColor White
Write-Host ""

Write-Host "5️⃣  Add environment variables (click 'Advanced settings'):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Copy these variables:" -ForegroundColor Cyan
Write-Host "   ----------------------------------------" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_API_URL=https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev"
Write-Host "   NEXT_PUBLIC_AI_URL=https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev"
Write-Host "   NEXT_PUBLIC_INVENTORY_URL=https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev"
Write-Host "   NEXT_PUBLIC_PAYMENTS_URL=https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev"
Write-Host "   NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d3qhkomcxcxmtl.cloudfront.net"
Write-Host "   NEXT_PUBLIC_ASSETS_BUCKET=webdpro-assets-dev"
Write-Host "   NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-north-1_RfO53Cz5t"
Write-Host "   NEXT_PUBLIC_COGNITO_CLIENT_ID=7g6sqvvnqsg628napds0k73190"
Write-Host "   NEXT_PUBLIC_COGNITO_DOMAIN=webdpro-auth-prod-2026"
Write-Host "   NEXT_PUBLIC_COGNITO_REGION=eu-north-1"
Write-Host "   NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key-id>"
Write-Host "   ----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "6️⃣  Click 'Save and deploy'" -ForegroundColor Yellow
Write-Host ""

Write-Host "7️⃣  Wait for deployment (5-10 minutes)" -ForegroundColor Yellow
Write-Host ""

Write-Host "8️⃣  Copy your Amplify URL:" -ForegroundColor Yellow
Write-Host "   Format: https://main.xxxxxx.amplifyapp.com" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  After Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Update Cognito callback URLs:" -ForegroundColor Yellow
Write-Host "   1. Go to AWS Cognito Console" -ForegroundColor White
Write-Host "   2. User Pool: eu-north-1_RfO53Cz5t" -ForegroundColor White
Write-Host "   3. Add your Amplify URL to callback URLs" -ForegroundColor White
Write-Host ""

Write-Host "📋 Update NEXT_PUBLIC_APP_URL:" -ForegroundColor Yellow
Write-Host "   1. Go back to Amplify Console" -ForegroundColor White
Write-Host "   2. Environment variables" -ForegroundColor White
Write-Host "   3. Add: NEXT_PUBLIC_APP_URL=<your-amplify-url>" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Your frontend will be live at:" -ForegroundColor Green
Write-Host "   https://main.xxxxxx.amplifyapp.com" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📖 For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   frontend/AMPLIFY_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""

# Ask if user wants to open Amplify Console
$openConsole = Read-Host "Do you want to open AWS Amplify Console now? (y/n)"
if ($openConsole -eq "y") {
    Start-Process "https://console.aws.amazon.com/amplify/"
    Write-Host "✅ Opening AWS Amplify Console in your browser..." -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Good luck with your deployment!" -ForegroundColor Cyan
