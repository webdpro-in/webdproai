# AWS Configuration Helper for WebDPro

Write-Host "AWS Configuration Helper" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Get your AWS Access Keys" -ForegroundColor Yellow
Write-Host "1. Go to AWS Console: https://console.aws.amazon.com" -ForegroundColor Cyan
Write-Host "2. Navigate to: IAM > Users > [Your Username] > Security Credentials" -ForegroundColor Cyan
Write-Host "3. Click 'Create Access Key' if you don't have one" -ForegroundColor Cyan
Write-Host "4. Copy both Access Key ID and Secret Access Key" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 2: Configure AWS CLI" -ForegroundColor Yellow
Write-Host "Run this command and enter your keys:" -ForegroundColor Cyan
Write-Host "aws configure" -ForegroundColor Green
Write-Host ""

Write-Host "Enter these values when prompted:" -ForegroundColor Yellow
Write-Host "- AWS Access Key ID: [Your Access Key from Step 1]" -ForegroundColor Gray
Write-Host "- AWS Secret Access Key: [Your Secret Key from Step 1]" -ForegroundColor Gray
Write-Host "- Default region name: eu-north-1" -ForegroundColor Gray
Write-Host "- Default output format: json" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 3: Verify Configuration" -ForegroundColor Yellow
Write-Host "After configuring, run:" -ForegroundColor Cyan
Write-Host "aws sts get-caller-identity" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Deploy WebDPro" -ForegroundColor Yellow
Write-Host "Once AWS is configured, run:" -ForegroundColor Cyan
Write-Host ".\free-tier-deploy.ps1" -ForegroundColor Green
Write-Host ""

# Check if AWS CLI is working
Write-Host "Checking current AWS configuration..." -ForegroundColor Blue
try {
    $identity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    Write-Host "[SUCCESS] AWS is configured!" -ForegroundColor Green
    Write-Host "Account: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "User: $($identity.Arn)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to deploy! Run: .\free-tier-deploy.ps1" -ForegroundColor Green
}
catch {
    Write-Host "[INFO] AWS CLI needs configuration" -ForegroundColor Yellow
    Write-Host "Please run: aws configure" -ForegroundColor Green
}