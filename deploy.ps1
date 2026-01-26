# WebDPro Deployment Script (PowerShell)
# Deploys all services in the correct order

param(
    [string]$Stage = "dev"
)

Write-Host "🚀 Starting WebDPro deployment..." -ForegroundColor Green
Write-Host "📦 Deploying to stage: $Stage" -ForegroundColor Yellow

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Check if Node.js dependencies are installed
Write-Host "📋 Installing dependencies..." -ForegroundColor Blue
npm install

# Deploy services in order
Write-Host "🔧 Deploying backend service..." -ForegroundColor Blue
Set-Location backend
npm install
npx serverless deploy --stage $Stage
$BackendInfo = npx serverless info --stage $Stage
$BackendUrl = ($BackendInfo | Select-String "ServiceEndpoint").ToString().Split()[1]
Set-Location ..

Write-Host "🤖 Deploying AI services..." -ForegroundColor Blue
Set-Location ai_services
npm install
npx serverless deploy --stage $Stage
$AiInfo = npx serverless info --stage $Stage
$AiUrl = ($AiInfo | Select-String "ServiceEndpoint").ToString().Split()[1]
Set-Location ..

Write-Host "📦 Deploying inventory service..." -ForegroundColor Blue
Set-Location inventory
npm install
npx serverless deploy --stage $Stage
$InventoryInfo = npx serverless info --stage $Stage
$InventoryUrl = ($InventoryInfo | Select-String "ServiceEndpoint").ToString().Split()[1]
Set-Location ..

Write-Host "🚚 Deploying delivery service..." -ForegroundColor Blue
Set-Location delivery
npm install
npx serverless deploy --stage $Stage
$DeliveryInfo = npx serverless info --stage $Stage
$DeliveryUrl = ($DeliveryInfo | Select-String "ServiceEndpoint").ToString().Split()[1]
Set-Location ..

# Update environment variables with service URLs
Write-Host "🔗 Updating service URLs..." -ForegroundColor Blue
Add-Content -Path ".env.local" -Value "BACKEND_SERVICE_URL=$BackendUrl"
Add-Content -Path ".env.local" -Value "AI_SERVICE_URL=$AiUrl"
Add-Content -Path ".env.local" -Value "INVENTORY_SERVICE_URL=$InventoryUrl"
Add-Content -Path ".env.local" -Value "DELIVERY_SERVICE_URL=$DeliveryUrl"

# Deploy frontend
Write-Host "🌐 Building and deploying frontend..." -ForegroundColor Blue
Set-Location frontend
npm install
npm run build

# If using AWS Amplify or S3+CloudFront, deploy here
# For now, just build
Write-Host "✅ Frontend built successfully. Deploy to your hosting platform." -ForegroundColor Green
Set-Location ..

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Yellow
Write-Host "Backend: $BackendUrl"
Write-Host "AI Services: $AiUrl"
Write-Host "Inventory: $InventoryUrl"
Write-Host "Delivery: $DeliveryUrl"
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env files with real AWS service IDs"
Write-Host "2. Configure Cognito User Pool"
Write-Host "3. Set up Razorpay keys"
Write-Host "4. Deploy frontend to your hosting platform"
Write-Host "5. Configure custom domain (optional)"