# WebDPro AI - Cross-Region Quick Deployment Script
# This script deploys services across us-east-1 (AI) and eu-north-1 (Storage/Logic)

param(
   [string]$Stage = "dev",
   [switch]$SkipChecks = $false
)

Write-Host "🚀 WebDPro AI Cross-Region Deployment Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "🌍 Architecture: AI (us-east-1) + Storage (eu-north-1)" -ForegroundColor Cyan
Write-Host ""

# Color functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }

# Check prerequisites
if (-not $SkipChecks) {
   Write-Info "Checking cross-region prerequisites..."
    
   # Check Node.js
   try {
      $nodeVersion = node --version
      Write-Success "Node.js version: $nodeVersion"
   }
   catch {
      Write-Error "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
      exit 1
   }
    
   # Check AWS CLI
   try {
      $awsVersion = aws --version
      Write-Success "AWS CLI installed: $awsVersion"
   }
   catch {
      Write-Error "AWS CLI not found. Please install from https://aws.amazon.com/cli/"
      exit 1
   }
    
   # Check AWS credentials
   try {
      $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
      Write-Success "AWS Account: $($identity.Account) (User: $($identity.Arn))"
   }
   catch {
      Write-Error "AWS credentials not configured. Please run 'aws configure'"
      exit 1
   }
    
   # Check cross-region access
   Write-Info "Testing cross-region access..."
    
   # Test Bedrock access in us-east-1
   try {
      aws bedrock list-foundation-models --region us-east-1 --max-results 1 | Out-Null
      Write-Success "Bedrock access verified in us-east-1"
   }
   catch {
      Write-Error "Bedrock access failed in us-east-1. Please request model access in AWS Console."
      Write-Warning "Go to: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess"
      exit 1
   }
    
   # Test S3 access in eu-north-1
   try {
      aws s3 ls --region eu-north-1 | Out-Null
      Write-Success "S3 access verified in eu-north-1"
   }
   catch {
      Write-Warning "S3 access issue in eu-north-1 (will be resolved during deployment)"
   }
    
   # Check Serverless Framework
   try {
      $slsVersion = npx serverless --version
      Write-Success "Serverless Framework available"
   }
   catch {
      Write-Warning "Installing Serverless Framework..."
      npm install -g serverless
   }
    
   Write-Success "All cross-region prerequisites met!"
   Write-Host ""
}

# Check environment file
if (-not (Test-Path ".env.local")) {
   Write-Warning ".env.local not found. Creating from template..."
   Copy-Item ".env.template" ".env.local"
   Write-Error "Please edit .env.local with your actual AWS and API keys before continuing."
   Write-Info "Required cross-region configuration:"
   Write-Host "  AWS_BEDROCK_REGION=us-east-1" -ForegroundColor Yellow
   Write-Host "  AWS_S3_REGION=eu-north-1" -ForegroundColor Yellow
   Write-Host "  AWS_BEDROCK_MODEL_PRIMARY=anthropic.claude-3-5-sonnet-20241022-v2:0" -ForegroundColor Yellow
   Write-Host "  COGNITO_USER_POOL_ID (create in eu-north-1)" -ForegroundColor Yellow
   Write-Host "  RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET" -ForegroundColor Yellow
   Write-Host ""
   Write-Host "After updating .env.local, run this script again."
   exit 1
}

# Verify cross-region configuration
Write-Info "Verifying cross-region configuration..."
$envContent = Get-Content ".env.local" -Raw

if ($envContent -match "AWS_BEDROCK_REGION=us-east-1") {
   Write-Success "Bedrock region configured for us-east-1"
}
else {
   Write-Error "AWS_BEDROCK_REGION must be set to us-east-1"
   exit 1
}

if ($envContent -match "AWS_S3_REGION=eu-north-1") {
   Write-Success "S3 region configured for eu-north-1"
}
else {
   Write-Error "AWS_S3_REGION must be set to eu-north-1"
   exit 1
}

# Install root dependencies
Write-Info "Installing root dependencies..."
npm install
Write-Success "Root dependencies installed"

# Deploy services in order
$deployedServices = @{}

Write-Info "Deploying Backend Service (1/4) - eu-north-1..."
Set-Location backend
npm install
try {
   npx serverless deploy --stage $Stage
   $backendInfo = npx serverless info --stage $Stage --verbose
   $backendUrl = ($backendInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
    
   # Capture Cognito Outputs
   try {
      $userPoolId = ($backendInfo | Select-String "UserPoolId:").ToString().Split()[1]
      $clientId = ($backendInfo | Select-String "UserPoolClientId:").ToString().Split()[1]
      $deployedServices["COGNITO_USER_POOL_ID"] = $userPoolId
      $deployedServices["COGNITO_CLIENT_ID"] = $clientId
      Write-Success "Cognito Configured: Pool $userPoolId, Client $clientId"
   }
   catch {
      Write-Warning "Could not auto-capture Cognito details (check serverless outputs)"
   }

   $deployedServices["BACKEND_SERVICE_URL"] = $backendUrl
   Write-Success "Backend deployed in eu-north-1: $backendUrl"
}
catch {
   Write-Error "Backend deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

Write-Info "Deploying AI Services (2/4) - Cross-Region (us-east-1 AI + eu-north-1 Storage)..."
Set-Location ai_services
npm install
try {
   npx serverless deploy --stage $Stage
   $aiInfo = npx serverless info --stage $Stage --verbose
   $aiUrl = ($aiInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
   $deployedServices["AI_SERVICE_URL"] = $aiUrl
   Write-Success "AI Services deployed with cross-region setup: $aiUrl"
   Write-Info "  🧠 AI Processing: us-east-1 (Bedrock)"
   Write-Info "  💾 Storage: eu-north-1 (S3)"
}
catch {
   Write-Error "AI Services deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

Write-Info "Deploying Inventory Service (3/4) - eu-north-1..."
Set-Location inventory
npm install
try {
   npx serverless deploy --stage $Stage
   $inventoryInfo = npx serverless info --stage $Stage --verbose
   $inventoryUrl = ($inventoryInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
   $deployedServices["INVENTORY_SERVICE_URL"] = $inventoryUrl
   Write-Success "Inventory Service deployed in eu-north-1: $inventoryUrl"
}
catch {
   Write-Error "Inventory Service deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

Write-Info "Deploying Delivery Service (4/4) - eu-north-1..."
Set-Location delivery
npm install
try {
   npx serverless deploy --stage $Stage
   $deliveryInfo = npx serverless info --stage $Stage --verbose
   $deliveryUrl = ($deliveryInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
   $deployedServices["DELIVERY_SERVICE_URL"] = $deliveryUrl
   Write-Success "Delivery Service deployed in eu-north-1: $deliveryUrl"
}
catch {
   Write-Error "Delivery Service deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

# Update environment file with service URLs
Write-Info "Updating .env.local with service URLs..."
foreach ($key in $deployedServices.Keys) {
   $value = $deployedServices[$key]
   if (Select-String -Path ".env.local" -Pattern "^$key=") {
      (Get-Content ".env.local") -replace "^$key=.*", "$key=$value" | Set-Content ".env.local"
   }
   else {
      Add-Content ".env.local" "$key=$value"
   }
}
Write-Success "Environment file updated"

# Build frontend
Write-Info "Building Frontend..."
Set-Location frontend
npm install
Copy-Item "..\.env.local" ".env.local"
try {
   npm run build
   Write-Success "Frontend built successfully"
}
catch {
   Write-Error "Frontend build failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

# Test cross-region functionality
Write-Info "Testing cross-region AI generation..."
try {
   $testPayload = @{
      prompt       = "Create a modern vegetable store for Mumbai"
      businessType = "grocery"
   } | ConvertTo-Json

   $response = Invoke-RestMethod -Uri "$($deployedServices['AI_SERVICE_URL'])/ai/generate" -Method Post -Body $testPayload -ContentType "application/json" -TimeoutSec 30
   Write-Success "Cross-region AI generation test successful!"
   Write-Info "  Generated content length: $($response.content.Length) characters"
}
catch {
   Write-Warning "Cross-region AI test failed (this is normal if Bedrock models aren't approved yet)"
   Write-Info "  Error: $($_.Exception.Message)"
}

# Summary
Write-Host ""
Write-Host "🎉 CROSS-REGION DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Architecture Summary:" -ForegroundColor Yellow
Write-Host "  🧠 AI Processing: us-east-1 (Claude 3.5 Sonnet + Bedrock models)" -ForegroundColor Cyan
Write-Host "  💾 Data Storage: eu-north-1 (S3 buckets + DynamoDB)" -ForegroundColor Cyan
Write-Host "  🏢 Business Logic: eu-north-1 (Lambda functions + API Gateway)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Deployed Services:" -ForegroundColor Yellow
foreach ($key in $deployedServices.Keys) {
   Write-Host "  $key = $($deployedServices[$key])" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure Bedrock model access approved in us-east-1"
Write-Host "2. Deploy frontend to Vercel/Netlify/AWS Amplify"
Write-Host "3. Test cross-region AI generation"
Write-Host "4. Configure custom domain (optional)"
Write-Host ""
Write-Host "🧪 Cross-Region Test Commands:" -ForegroundColor Yellow
Write-Host "# Test AI generation (us-east-1 Bedrock → eu-north-1 S3):" -ForegroundColor Gray
Write-Host "curl -X POST $($deployedServices['AI_SERVICE_URL'])/ai/generate \\" -ForegroundColor Gray
Write-Host "  -H 'Content-Type: application/json' \\" -ForegroundColor Gray
Write-Host "  -d '{\"prompt\": \"Create a vegetable store for Mumbai\", \"businessType\": \"grocery\"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "# Verify S3 buckets in eu-north-1:" -ForegroundColor Gray
Write-Host "aws s3 ls --region eu-north-1 | grep webdpro" -ForegroundColor Gray
Write-Host ""
Write-Host "# Check Bedrock models in us-east-1:" -ForegroundColor Gray
Write-Host "aws bedrock list-foundation-models --region us-east-1 | grep claude" -ForegroundColor Gray
Write-Host ""
Write-Warning "CRITICAL: Ensure AWS Bedrock model access is approved in us-east-1:"
Write-Host "  Required Models:" -ForegroundColor Yellow
Write-Host "  - Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)" -ForegroundColor Gray
Write-Host "  - Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)" -ForegroundColor Gray
Write-Host "  - Amazon Titan Text Express (amazon.titan-text-express-v1)" -ForegroundColor Gray
Write-Host "  - Amazon Titan Image Generator (amazon.titan-image-generator-v1)" -ForegroundColor Gray
Write-Host "  - Meta Llama 3 70B (meta.llama3-70b-instruct-v1:0)" -ForegroundColor Gray
Write-Host ""
Write-Host "Visit: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess" -ForegroundColor Cyan
Write-Host ""
Write-Success "WebDPro AI is ready with cross-region architecture! 🚀"
Write-Info "🌍 AI in us-east-1 + Storage in eu-north-1 = Best of both worlds!"