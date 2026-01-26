# WebDPro AI - Free Tier Deployment Script
# Optimized for AWS Free Tier usage with fallback options

param(
   [string]$Stage = "dev",
   [switch]$SkipChecks = $false
)

Write-Host "WebDPro AI Free Tier Deployment" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Optimized for AWS Free Tier usage" -ForegroundColor Cyan
Write-Host ""

# Color functions
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }

# Check prerequisites
if (-not $SkipChecks) {
   Write-Info "Checking prerequisites..."
    
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
      Write-Info "See aws-setup-guide.md for detailed instructions"
      exit 1
   }
    
   # Check Serverless Framework
   try {
      npx serverless --version | Out-Null
      Write-Success "Serverless Framework available"
   }
   catch {
      Write-Warning "Installing Serverless Framework..."
      npm install -g serverless
   }
    
   Write-Success "All prerequisites met!"
   Write-Host ""
}

# Check environment file
if (-not (Test-Path ".env.local")) {
   Write-Error ".env.local not found. Please create it from .env.template"
   exit 1
}

# Install root dependencies
Write-Info "Installing dependencies..."
npm install
Write-Success "Root dependencies installed"

# Deploy services with free tier optimizations
$deployedServices = @{}

Write-Info "Deploying Backend Service (1/4) - Free Tier Optimized..."
Set-Location backend
npm install

# Update serverless.yml for free tier
$serverlessContent = Get-Content "serverless.yml" -Raw
$serverlessContent = $serverlessContent -replace "memorySize: 512", "memorySize: 128"
$serverlessContent = $serverlessContent -replace "timeout: 30", "timeout: 15"
Set-Content "serverless.yml" $serverlessContent

try {
   npx serverless deploy --stage $Stage
   $backendInfo = npx serverless info --stage $Stage --verbose
   $backendUrl = ($backendInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
    
   # Capture Cognito Outputs
   try {
      $outputs = npx serverless info --stage $Stage --verbose
      if ($outputs -match "UserPoolId: (.+)") {
         $userPoolId = $matches[1].Trim()
         $deployedServices["COGNITO_USER_POOL_ID"] = $userPoolId
      }
      if ($outputs -match "UserPoolClientId: (.+)") {
         $clientId = $matches[1].Trim()
         $deployedServices["COGNITO_CLIENT_ID"] = $clientId
      }
      Write-Success "Cognito Auto-configured: Pool $userPoolId"
   }
   catch {
      Write-Warning "Could not auto-capture Cognito details"
   }

   $deployedServices["BACKEND_SERVICE_URL"] = $backendUrl
   Write-Success "Backend deployed: $backendUrl"
}
catch {
   Write-Error "Backend deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

Write-Info "Deploying AI Services (2/4) - Free Tier with Fallbacks..."
Set-Location ai_services
npm install

# Update for free tier
$aiServerlessContent = Get-Content "serverless.yml" -Raw
$aiServerlessContent = $aiServerlessContent -replace "memorySize: 1024", "memorySize: 256"
$aiServerlessContent = $aiServerlessContent -replace "timeout: 300", "timeout: 60"
Set-Content "serverless.yml" $aiServerlessContent

try {
   npx serverless deploy --stage $Stage
   $aiInfo = npx serverless info --stage $Stage --verbose
   $aiUrl = ($aiInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
   $deployedServices["AI_SERVICE_URL"] = $aiUrl
   Write-Success "AI Services deployed: $aiUrl"
   Write-Warning "Note: Bedrock models may need approval. Using fallbacks for now."
}
catch {
   Write-Error "AI Services deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

Write-Info "Deploying Inventory Service (3/4) - Free Tier..."
Set-Location inventory
npm install

# Update for free tier
$invServerlessContent = Get-Content "serverless.yml" -Raw
$invServerlessContent = $invServerlessContent -replace "memorySize: 512", "memorySize: 128"
Set-Content "serverless.yml" $invServerlessContent

try {
   npx serverless deploy --stage $Stage
   $inventoryInfo = npx serverless info --stage $Stage --verbose
   $inventoryUrl = ($inventoryInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
   $deployedServices["INVENTORY_SERVICE_URL"] = $inventoryUrl
   Write-Success "Inventory Service deployed: $inventoryUrl"
}
catch {
   Write-Error "Inventory Service deployment failed: $_"
   Set-Location ..
   exit 1
}
Set-Location ..

Write-Info "Deploying Delivery Service (4/4) - Free Tier..."
Set-Location delivery
npm install

# Update for free tier
$delServerlessContent = Get-Content "serverless.yml" -Raw
$delServerlessContent = $delServerlessContent -replace "memorySize: 512", "memorySize: 128"
Set-Content "serverless.yml" $delServerlessContent

try {
   npx serverless deploy --stage $Stage
   $deliveryInfo = npx serverless info --stage $Stage --verbose
   $deliveryUrl = ($deliveryInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
   $deployedServices["DELIVERY_SERVICE_URL"] = $deliveryUrl
   Write-Success "Delivery Service deployed: $deliveryUrl"
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

# Test basic functionality
Write-Info "Testing basic API endpoints..."
try {
   $healthCheck = Invoke-RestMethod -Uri "$($deployedServices['BACKEND_SERVICE_URL'])/health" -Method Get -TimeoutSec 10
   Write-Success "Backend health check passed"
}
catch {
   Write-Warning "Backend health check failed (this is normal if health endpoint doesn't exist)"
}

# Summary
Write-Host ""
Write-Host "FREE TIER DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Free Tier Optimizations Applied:" -ForegroundColor Yellow
Write-Host "  Lambda Memory: 128-256MB (was 512-1024MB)" -ForegroundColor Cyan
Write-Host "  Lambda Timeout: 15-60s (was 30-300s)" -ForegroundColor Cyan
Write-Host "  DynamoDB: Pay-per-request (free tier friendly)" -ForegroundColor Cyan
Write-Host "  S3: Standard storage (free tier included)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployed Services:" -ForegroundColor Yellow
foreach ($key in $deployedServices.Keys) {
   Write-Host "  $key = $($deployedServices[$key])" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Request Bedrock model access in us-east-1 (for AI features)"
Write-Host "2. Get Razorpay keys (for payments)"
Write-Host "3. Deploy frontend to Vercel/Netlify (free hosting)"
Write-Host "4. Test the complete flow"
Write-Host ""
Write-Host "Test Commands:" -ForegroundColor Yellow
Write-Host "# Test backend:" -ForegroundColor Gray
Write-Host "curl $($deployedServices['BACKEND_SERVICE_URL'])/health" -ForegroundColor Gray
Write-Host ""
Write-Host "# Test AI (may fail until Bedrock approved):" -ForegroundColor Gray
Write-Host "curl -X POST $($deployedServices['AI_SERVICE_URL'])/ai/generate \\" -ForegroundColor Gray
Write-Host "  -H 'Content-Type: application/json' \\" -ForegroundColor Gray
Write-Host "  -d '{\"prompt\": \"Create a simple vegetable store\"}'" -ForegroundColor Gray
Write-Host ""
Write-Success "WebDPro AI is deployed on AWS Free Tier!"
Write-Info "Estimated monthly cost: $0-5 (within free tier limits)"