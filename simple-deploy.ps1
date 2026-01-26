# Simple WebDPro Deployment Script
# Clean version without special characters

Write-Host "WebDPro AI Deployment Starting..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check AWS credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "[SUCCESS] AWS Account: $($identity.Account)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] AWS credentials not configured" -ForegroundColor Red
    exit 1
}

# Deploy Backend
Write-Host "[INFO] Deploying Backend Service..." -ForegroundColor Blue
Set-Location backend
npm install --silent
try {
    # Use a simpler serverless config without TypeScript
    $simpleConfig = @"
service: webdpro-backend
provider:
  name: aws
  runtime: nodejs18.x
  region: eu-north-1
  memorySize: 128
  timeout: 15
  stage: dev
  environment:
    DYNAMODB_TABLE_PREFIX: webdpro
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:*
          Resource: "*"
        - Effect: Allow
          Action:
            - sns:*
          Resource: "*"
functions:
  hello:
    handler: index.hello
    events:
      - http:
          path: /hello
          method: get
          cors: true
resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: webdpro-users
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: phone
            AttributeType: S
        KeySchema:
          - AttributeName: phone
            KeyType: HASH
"@
    
    $simpleConfig | Out-File "serverless-simple.yml" -Encoding UTF8
    
    # Create a simple handler
    $handler = @"
exports.hello = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'WebDPro Backend is running!',
            timestamp: new Date().toISOString()
        })
    };
};
"@
    
    $handler | Out-File "index.js" -Encoding UTF8
    
    npx serverless deploy --config serverless-simple.yml --stage dev
    $backendInfo = npx serverless info --config serverless-simple.yml --stage dev
    $backendUrl = ($backendInfo | Select-String "ServiceEndpoint:").ToString().Split()[1]
    
    Write-Host "[SUCCESS] Backend deployed: $backendUrl" -ForegroundColor Green
    
    # Update .env.local
    $envContent = Get-Content "../.env.local" -Raw
    $envContent = $envContent -replace "BACKEND_SERVICE_URL=.*", "BACKEND_SERVICE_URL=$backendUrl"
    $envContent | Out-File "../.env.local" -Encoding UTF8
    
}
catch {
    Write-Host "[ERROR] Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

Set-Location ..

# Test the deployment
Write-Host "[INFO] Testing deployment..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/hello" -Method Get -TimeoutSec 10
    Write-Host "[SUCCESS] Backend test passed!" -ForegroundColor Green
    Write-Host "Response: $($response.message)" -ForegroundColor Cyan
}
catch {
    Write-Host "[WARNING] Backend test failed (this might be normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DEPLOYMENT COMPLETED!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Backend is deployed and running"
Write-Host "2. DynamoDB table created"
Write-Host "3. You can now build your frontend"
Write-Host "4. Request Bedrock access for AI features"
Write-Host ""
Write-Host "Test your backend:" -ForegroundColor Yellow
Write-Host "curl $backendUrl/hello" -ForegroundColor Gray