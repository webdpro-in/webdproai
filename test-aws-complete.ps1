# ============================================================================
# WebDPro AWS Complete System Diagnostic Script
# ============================================================================
# This script tests EVERY AWS service, API endpoint, and integration
# Tests: Cognito, DynamoDB, S3, Lambda, API Gateway, Bedrock, CloudFront, SNS
# ============================================================================

param(
    [switch]$Verbose,
    [switch]$SkipSlowTests,
    [string]$OutputFile = "aws-diagnostic-report.json"
)

# Color output functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Section { param($msg) Write-Host "`n========== $msg ==========" -ForegroundColor Magenta }

# Load environment variables
$ErrorActionPreference = "Continue"
$results = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    tests = @{}
    summary = @{
        total = 0
        passed = 0
        failed = 0
        warnings = 0
    }
}

# ============================================================================
# SECTION 1: ENVIRONMENT VALIDATION
# ============================================================================
Write-Section "1. ENVIRONMENT VALIDATION"

function Test-EnvironmentVariables {
    Write-Info "Checking environment configuration..."
    
    $envFiles = @(
        ".env.local",
        "backend/.env",
        "ai_services/.env",
        "payments/.env",
        "inventory/.env",
        "delivery/.env",
        "frontend/.env.local"
    )
    
    $envResults = @{}
    
    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            $envResults[$file] = @{
                exists = $true
                hasAwsRegion = $content -match "AWS_REGION"
                hasApiUrls = $content -match "SERVICE_URL|API_URL"
            }
            Write-Success "Found: $file"
        } else {
            $envResults[$file] = @{ exists = $false }
            Write-Warning "Missing: $file"
        }
    }
    
    return $envResults
}

$results.tests.environment = Test-EnvironmentVariables
$results.summary.total++
if ($results.tests.environment.".env.local".exists) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 2: AWS CLI & CREDENTIALS
# ============================================================================
Write-Section "2. AWS CLI & CREDENTIALS"

function Test-AwsCli {
    Write-Info "Testing AWS CLI installation and credentials..."
    
    $awsTest = @{
        cliInstalled = $false
        credentialsConfigured = $false
        region = $null
        accountId = $null
    }
    
    try {
        $version = aws --version 2>&1
        $awsTest.cliInstalled = $true
        Write-Success "AWS CLI installed: $version"
    } catch {
        Write-Error "AWS CLI not installed"
        return $awsTest
    }
    
    try {
        $identity = aws sts get-caller-identity --output json 2>&1 | ConvertFrom-Json
        $awsTest.credentialsConfigured = $true
        $awsTest.accountId = $identity.Account
        Write-Success "AWS Credentials configured - Account: $($identity.Account)"
    } catch {
        Write-Error "AWS Credentials not configured"
    }
    
    try {
        $region = aws configure get region
        $awsTest.region = $region
        Write-Success "AWS Region: $region"
    } catch {
        Write-Warning "AWS Region not set"
    }
    
    return $awsTest
}

$results.tests.awsCli = Test-AwsCli
$results.summary.total++
if ($results.tests.awsCli.credentialsConfigured) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 3: COGNITO AUTHENTICATION
# ============================================================================
Write-Section "3. COGNITO AUTHENTICATION"

function Test-Cognito {
    Write-Info "Testing Cognito User Pool..."
    
    $cognitoTest = @{
        userPoolExists = $false
        clientExists = $false
        domainExists = $false
        googleProviderConfigured = $false
        userPoolId = $null
        clientId = $null
    }
    
    # Load from .env.local
    if (Test-Path ".env.local") {
        $env = Get-Content ".env.local" | Where-Object { $_ -match "COGNITO" }
        foreach ($line in $env) {
            if ($line -match "COGNITO_USER_POOL_ID=(.+)") {
                $cognitoTest.userPoolId = $matches[1].Trim('"')
            }
            if ($line -match "COGNITO_CLIENT_ID=(.+)") {
                $cognitoTest.clientId = $matches[1].Trim('"')
            }
        }
    }
    
    if ($cognitoTest.userPoolId) {
        try {
            $pool = aws cognito-idp describe-user-pool --user-pool-id $cognitoTest.userPoolId --output json 2>&1 | ConvertFrom-Json
            $cognitoTest.userPoolExists = $true
            Write-Success "User Pool exists: $($cognitoTest.userPoolId)"
            
            # Check for Lambda triggers
            if ($pool.UserPool.LambdaConfig) {
                Write-Success "Lambda triggers configured"
            }
        } catch {
            Write-Error "User Pool not found: $($cognitoTest.userPoolId)"
        }
    }
    
    if ($cognitoTest.clientId) {
        try {
            $client = aws cognito-idp describe-user-pool-client --user-pool-id $cognitoTest.userPoolId --client-id $cognitoTest.clientId --output json 2>&1 | ConvertFrom-Json
            $cognitoTest.clientExists = $true
            Write-Success "User Pool Client exists: $($cognitoTest.clientId)"
            
            # Check OAuth configuration
            if ($client.UserPoolClient.AllowedOAuthFlows) {
                Write-Success "OAuth flows configured: $($client.UserPoolClient.AllowedOAuthFlows -join ', ')"
            }
        } catch {
            Write-Error "User Pool Client not found"
        }
    }
    
    return $cognitoTest
}

$results.tests.cognito = Test-Cognito
$results.summary.total++
if ($results.tests.cognito.userPoolExists) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 4: DYNAMODB TABLES
# ============================================================================
Write-Section "4. DYNAMODB TABLES"

function Test-DynamoDB {
    Write-Info "Testing DynamoDB tables..."
    
    $requiredTables = @(
        "webdpro-users",
        "webdpro-stores",
        "webdpro-tenants",
        "webdpro-orders",
        "webdpro-payments",
        "webdpro-products",
        "webdpro-delivery"
    )
    
    $dynamoTest = @{
        tables = @{}
        allTablesExist = $true
    }
    
    foreach ($table in $requiredTables) {
        try {
            $tableInfo = aws dynamodb describe-table --table-name $table --output json 2>&1 | ConvertFrom-Json
            $dynamoTest.tables[$table] = @{
                exists = $true
                status = $tableInfo.Table.TableStatus
                itemCount = $tableInfo.Table.ItemCount
                billingMode = $tableInfo.Table.BillingModeSummary.BillingMode
            }
            Write-Success "$table - Status: $($tableInfo.Table.TableStatus), Items: $($tableInfo.Table.ItemCount)"
        } catch {
            $dynamoTest.tables[$table] = @{ exists = $false }
            $dynamoTest.allTablesExist = $false
            Write-Error "$table - NOT FOUND"
        }
    }
    
    return $dynamoTest
}

$results.tests.dynamodb = Test-DynamoDB
$results.summary.total++
if ($results.tests.dynamodb.allTablesExist) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 5: S3 BUCKETS
# ============================================================================
Write-Section "5. S3 BUCKETS"

function Test-S3Buckets {
    Write-Info "Testing S3 buckets..."
    
    $requiredBuckets = @(
        "webdpro-ai-storage-dev",
        "webdpro-websites-ai-gen-dev",
        "webdpro-assets-ai-gen-dev"
    )
    
    $s3Test = @{
        buckets = @{}
        allBucketsExist = $true
    }
    
    foreach ($bucket in $requiredBuckets) {
        try {
            $bucketInfo = aws s3api head-bucket --bucket $bucket 2>&1
            $s3Test.buckets[$bucket] = @{
                exists = $true
                accessible = $true
            }
            
            # Check bucket policy
            try {
                $policy = aws s3api get-bucket-policy --bucket $bucket 2>&1
                $s3Test.buckets[$bucket].hasPolicy = $true
            } catch {
                $s3Test.buckets[$bucket].hasPolicy = $false
            }
            
            # Check CORS
            try {
                $cors = aws s3api get-bucket-cors --bucket $bucket 2>&1
                $s3Test.buckets[$bucket].hasCors = $true
            } catch {
                $s3Test.buckets[$bucket].hasCors = $false
            }
            
            Write-Success "$bucket - Accessible"
        } catch {
            $s3Test.buckets[$bucket] = @{ exists = $false }
            $s3Test.allBucketsExist = $false
            Write-Error "$bucket - NOT FOUND or NOT ACCESSIBLE"
        }
    }
    
    return $s3Test
}

$results.tests.s3 = Test-S3Buckets
$results.summary.total++
if ($results.tests.s3.allBucketsExist) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 6: LAMBDA FUNCTIONS
# ============================================================================
Write-Section "6. LAMBDA FUNCTIONS"

function Test-LambdaFunctions {
    Write-Info "Testing Lambda functions..."
    
    $lambdaTest = @{
        functions = @{}
        totalFunctions = 0
        activeFunctions = 0
    }
    
    try {
        $functions = aws lambda list-functions --output json 2>&1 | ConvertFrom-Json
        $webdproFunctions = $functions.Functions | Where-Object { $_.FunctionName -like "webdpro-*" }
        
        $lambdaTest.totalFunctions = $webdproFunctions.Count
        
        foreach ($func in $webdproFunctions) {
            $lambdaTest.functions[$func.FunctionName] = @{
                runtime = $func.Runtime
                memorySize = $func.MemorySize
                timeout = $func.Timeout
                lastModified = $func.LastModified
            }
            
            if ($func.State -eq "Active") {
                $lambdaTest.activeFunctions++
                Write-Success "$($func.FunctionName) - Active ($($func.Runtime))"
            } else {
                Write-Warning "$($func.FunctionName) - $($func.State)"
            }
        }
        
        Write-Info "Total WebDPro Lambda functions: $($lambdaTest.totalFunctions)"
    } catch {
        Write-Error "Failed to list Lambda functions"
    }
    
    return $lambdaTest
}

$results.tests.lambda = Test-LambdaFunctions
$results.summary.total++
if ($results.tests.lambda.totalFunctions -gt 0) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 7: API GATEWAY ENDPOINTS
# ============================================================================
Write-Section "7. API GATEWAY ENDPOINTS"

function Test-ApiGateway {
    Write-Info "Testing API Gateway endpoints..."
    
    $apiTest = @{
        backend = @{ url = $null; reachable = $false }
        aiServices = @{ url = $null; reachable = $false }
        inventory = @{ url = $null; reachable = $false }
        payments = @{ url = $null; reachable = $false }
    }
    
    # Load URLs from .env.local
    if (Test-Path ".env.local") {
        $env = Get-Content ".env.local"
        foreach ($line in $env) {
            if ($line -match "BACKEND_SERVICE_URL=(.+)") {
                $apiTest.backend.url = $matches[1].Trim('"')
            }
            if ($line -match "AI_SERVICE_URL=(.+)") {
                $apiTest.aiServices.url = $matches[1].Trim('"')
            }
            if ($line -match "INVENTORY_SERVICE_URL=(.+)") {
                $apiTest.inventory.url = $matches[1].Trim('"')
            }
            if ($line -match "PAYMENTS_SERVICE_URL=(.+)") {
                $apiTest.payments.url = $matches[1].Trim('"')
            }
        }
    }
    
    # Test each endpoint
    foreach ($service in $apiTest.Keys) {
        $url = $apiTest[$service].url
        if ($url) {
            try {
                $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
                $apiTest[$service].reachable = $true
                $apiTest[$service].statusCode = $response.StatusCode
                Write-Success "$service API - Reachable ($url)"
            } catch {
                $apiTest[$service].reachable = $false
                $apiTest[$service].error = $_.Exception.Message
                Write-Error "$service API - NOT REACHABLE ($url)"
            }
        } else {
            Write-Warning "$service API - URL not configured"
        }
    }
    
    return $apiTest
}

$results.tests.apiGateway = Test-ApiGateway
$results.summary.total++
$reachableApis = ($results.tests.apiGateway.Values | Where-Object { $_.reachable }).Count
if ($reachableApis -gt 0) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 8: BACKEND API ENDPOINTS
# ============================================================================
Write-Section "8. BACKEND API ENDPOINTS"

function Test-BackendEndpoints {
    Write-Info "Testing Backend API endpoints..."
    
    $backendUrl = $results.tests.apiGateway.backend.url
    if (-not $backendUrl) {
        Write-Warning "Backend URL not configured"
        return @{ tested = $false }
    }
    
    $endpoints = @{
        "GET /stores" = @{ method = "GET"; path = "/stores" }
        "POST /auth/otp/request" = @{ method = "POST"; path = "/auth/otp/request" }
        "GET /auth/profile" = @{ method = "GET"; path = "/auth/profile" }
    }
    
    $endpointTest = @{}
    
    foreach ($name in $endpoints.Keys) {
        $endpoint = $endpoints[$name]
        $fullUrl = "$backendUrl$($endpoint.path)"
        
        try {
            if ($endpoint.method -eq "GET") {
                $response = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
            } else {
                $body = @{} | ConvertTo-Json
                $response = Invoke-WebRequest -Uri $fullUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
            }
            
            $endpointTest[$name] = @{
                reachable = $true
                statusCode = $response.StatusCode
            }
            Write-Success "$name - Status: $($response.StatusCode)"
        } catch {
            $endpointTest[$name] = @{
                reachable = $false
                error = $_.Exception.Message
            }
            Write-Warning "$name - $($_.Exception.Message)"
        }
    }
    
    return $endpointTest
}

$results.tests.backendEndpoints = Test-BackendEndpoints
$results.summary.total++
if ($results.tests.backendEndpoints.Count -gt 0) { $results.summary.passed++ } else { $results.summary.warnings++ }

# ============================================================================
# SECTION 9: AI SERVICES (BEDROCK)
# ============================================================================
Write-Section "9. AI SERVICES (BEDROCK)"

function Test-BedrockAccess {
    Write-Info "Testing AWS Bedrock access..."
    
    $bedrockTest = @{
        accessible = $false
        models = @{}
    }
    
    $models = @(
        "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "anthropic.claude-3-haiku-20240307-v1:0",
        "amazon.titan-text-express-v1",
        "amazon.titan-image-generator-v1"
    )
    
    try {
        # List available models
        $availableModels = aws bedrock list-foundation-models --region us-east-1 --output json 2>&1 | ConvertFrom-Json
        $bedrockTest.accessible = $true
        Write-Success "Bedrock accessible in us-east-1"
        
        foreach ($model in $models) {
            $found = $availableModels.modelSummaries | Where-Object { $_.modelId -eq $model }
            if ($found) {
                $bedrockTest.models[$model] = @{
                    available = $true
                    status = $found.modelLifecycle.status
                }
                Write-Success "Model available: $model"
            } else {
                $bedrockTest.models[$model] = @{ available = $false }
                Write-Warning "Model not available: $model"
            }
        }
    } catch {
        Write-Error "Bedrock not accessible: $($_.Exception.Message)"
    }
    
    return $bedrockTest
}

$results.tests.bedrock = Test-BedrockAccess
$results.summary.total++
if ($results.tests.bedrock.accessible) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# SECTION 10: CLOUDFRONT DISTRIBUTION
# ============================================================================
Write-Section "10. CLOUDFRONT DISTRIBUTION"

function Test-CloudFront {
    Write-Info "Testing CloudFront distribution..."
    
    $cfTest = @{
        configured = $false
        domain = $null
        reachable = $false
    }
    
    # Load from .env.local
    if (Test-Path ".env.local") {
        $env = Get-Content ".env.local"
        foreach ($line in $env) {
            if ($line -match "CLOUDFRONT_DISTRIBUTION_ID=(.+)") {
                $cfTest.domain = $matches[1].Trim('"')
                $cfTest.configured = $true
            }
        }
    }
    
    if ($cfTest.domain) {
        try {
            $url = "https://$($cfTest.domain)"
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -ErrorAction Stop
            $cfTest.reachable = $true
            $cfTest.statusCode = $response.StatusCode
            Write-Success "CloudFront reachable: $url"
        } catch {
            Write-Warning "CloudFront not reachable: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "CloudFront domain not configured"
    }
    
    return $cfTest
}

$results.tests.cloudfront = Test-CloudFront
$results.summary.total++
if ($results.tests.cloudfront.configured) { $results.summary.passed++ } else { $results.summary.warnings++ }

# ============================================================================
# SECTION 11: SNS TOPICS
# ============================================================================
Write-Section "11. SNS TOPICS"

function Test-SNS {
    Write-Info "Testing SNS topics..."
    
    $snsTest = @{
        topics = @{}
    }
    
    try {
        $topics = aws sns list-topics --output json 2>&1 | ConvertFrom-Json
        $webdproTopics = $topics.Topics | Where-Object { $_.TopicArn -like "*webdpro-events*" }
        
        foreach ($topic in $webdproTopics) {
            $topicName = $topic.TopicArn.Split(":")[-1]
            $snsTest.topics[$topicName] = @{
                arn = $topic.TopicArn
                exists = $true
            }
            
            # Get subscriptions
            try {
                $subs = aws sns list-subscriptions-by-topic --topic-arn $topic.TopicArn --output json 2>&1 | ConvertFrom-Json
                $snsTest.topics[$topicName].subscriptions = $subs.Subscriptions.Count
                Write-Success "$topicName - $($subs.Subscriptions.Count) subscriptions"
            } catch {
                Write-Warning "$topicName - Could not get subscriptions"
            }
        }
    } catch {
        Write-Error "Failed to list SNS topics"
    }
    
    return $snsTest
}

$results.tests.sns = Test-SNS
$results.summary.total++
if ($results.tests.sns.topics.Count -gt 0) { $results.summary.passed++ } else { $results.summary.warnings++ }

# ============================================================================
# SECTION 12: RAZORPAY INTEGRATION
# ============================================================================
Write-Section "12. RAZORPAY INTEGRATION"

function Test-Razorpay {
    Write-Info "Testing Razorpay configuration..."
    
    $razorpayTest = @{
        configured = $false
        keyId = $null
        testMode = $false
    }
    
    # Load from .env.local
    if (Test-Path ".env.local") {
        $env = Get-Content ".env.local"
        foreach ($line in $env) {
            if ($line -match "RAZORPAY_KEY_ID=(.+)") {
                $razorpayTest.keyId = $matches[1].Trim('"')
                $razorpayTest.configured = $true
                $razorpayTest.testMode = $razorpayTest.keyId -like "rzp_test_*"
            }
        }
    }
    
    if ($razorpayTest.configured) {
        $mode = if ($razorpayTest.testMode) { "TEST" } else { "LIVE" }
        Write-Success "Razorpay configured - Mode: $mode"
    } else {
        Write-Warning "Razorpay not configured"
    }
    
    return $razorpayTest
}

$results.tests.razorpay = Test-Razorpay
$results.summary.total++
if ($results.tests.razorpay.configured) { $results.summary.passed++ } else { $results.summary.warnings++ }

# ============================================================================
# SECTION 13: FRONTEND CONFIGURATION
# ============================================================================
Write-Section "13. FRONTEND CONFIGURATION"

function Test-Frontend {
    Write-Info "Testing Frontend configuration..."
    
    $frontendTest = @{
        envConfigured = $false
        nextConfigExists = $false
        dependencies = @{}
    }
    
    if (Test-Path "frontend/.env.local") {
        $frontendTest.envConfigured = $true
        Write-Success "Frontend .env.local exists"
    } else {
        Write-Warning "Frontend .env.local missing"
    }
    
    if (Test-Path "frontend/next.config.js") {
        $frontendTest.nextConfigExists = $true
        Write-Success "next.config.js exists"
    }
    
    if (Test-Path "frontend/package.json") {
        $package = Get-Content "frontend/package.json" | ConvertFrom-Json
        $frontendTest.dependencies = @{
            next = $package.dependencies.next
            react = $package.dependencies.react
            typescript = $package.devDependencies.typescript
        }
        Write-Success "Dependencies: Next.js $($package.dependencies.next)"
    }
    
    return $frontendTest
}

$results.tests.frontend = Test-Frontend
$results.summary.total++
if ($results.tests.frontend.envConfigured) { $results.summary.passed++ } else { $results.summary.warnings++ }

# ============================================================================
# SECTION 14: CROSS-SERVICE INTEGRATION TEST
# ============================================================================
Write-Section "14. CROSS-SERVICE INTEGRATION"

function Test-Integration {
    Write-Info "Testing cross-service integration..."
    
    $integrationTest = @{
        backendToAI = $false
        backendToDynamoDB = $false
        backendToS3 = $false
        inventoryToSNS = $false
    }
    
    # Check if backend can reach AI service
    $backendEnv = Get-Content "backend/.env" -Raw
    if ($backendEnv -match "AI_SERVICE_URL") {
        $integrationTest.backendToAI = $true
        Write-Success "Backend → AI Service: Configured"
    } else {
        Write-Warning "Backend → AI Service: Not configured"
    }
    
    # Check DynamoDB table prefix consistency
    $backendPrefix = if ($backendEnv -match "DYNAMODB_TABLE_PREFIX=(.+)") { $matches[1] } else { $null }
    $inventoryEnv = Get-Content "inventory/.env" -Raw
    $inventoryPrefix = if ($inventoryEnv -match "DYNAMODB_TABLE_PREFIX=(.+)") { $matches[1] } else { $null }
    
    if ($backendPrefix -eq $inventoryPrefix) {
        $integrationTest.backendToDynamoDB = $true
        Write-Success "DynamoDB table prefix consistent: $backendPrefix"
    } else {
        Write-Warning "DynamoDB table prefix mismatch"
    }
    
    # Check S3 bucket configuration
    if ($backendEnv -match "AWS_S3_BUCKET") {
        $integrationTest.backendToS3 = $true
        Write-Success "Backend → S3: Configured"
    }
    
    # Check SNS topic ARN
    if ($inventoryEnv -match "EVENTS_TOPIC_ARN") {
        $integrationTest.inventoryToSNS = $true
        Write-Success "Inventory → SNS: Configured"
    }
    
    return $integrationTest
}

$results.tests.integration = Test-Integration
$results.summary.total++
$integrationPassed = ($results.tests.integration.Values | Where-Object { $_ -eq $true }).Count
if ($integrationPassed -ge 3) { $results.summary.passed++ } else { $results.summary.warnings++ }

# ============================================================================
# SECTION 15: DEPLOYMENT STATUS
# ============================================================================
Write-Section "15. DEPLOYMENT STATUS"

function Test-Deployment {
    Write-Info "Checking deployment status..."
    
    $deployTest = @{
        backend = @{ deployed = $false }
        aiServices = @{ deployed = $false }
        inventory = @{ deployed = $false }
        payments = @{ deployed = $false }
    }
    
    # Check for .serverless directories
    if (Test-Path "backend/.serverless/serverless-state.json") {
        $deployTest.backend.deployed = $true
        $state = Get-Content "backend/.serverless/serverless-state.json" | ConvertFrom-Json
        $deployTest.backend.stage = $state.service.stage
        Write-Success "Backend deployed - Stage: $($state.service.stage)"
    } else {
        Write-Warning "Backend not deployed"
    }
    
    if (Test-Path "ai_services/.serverless/serverless-state.json") {
        $deployTest.aiServices.deployed = $true
        Write-Success "AI Services deployed"
    } else {
        Write-Warning "AI Services not deployed"
    }
    
    if (Test-Path "inventory/.serverless/serverless-state.json") {
        $deployTest.inventory.deployed = $true
        Write-Success "Inventory deployed"
    } else {
        Write-Warning "Inventory not deployed"
    }
    
    if (Test-Path "payments/.serverless/serverless-state.json") {
        $deployTest.payments.deployed = $true
        Write-Success "Payments deployed"
    } else {
        Write-Warning "Payments not deployed"
    }
    
    return $deployTest
}

$results.tests.deployment = Test-Deployment
$results.summary.total++
$deployedServices = ($results.tests.deployment.Values | Where-Object { $_.deployed }).Count
if ($deployedServices -ge 3) { $results.summary.passed++ } else { $results.summary.failed++ }

# ============================================================================
# FINAL REPORT
# ============================================================================
Write-Section "DIAGNOSTIC SUMMARY"

Write-Host ""
Write-Host "Total Tests: $($results.summary.total)" -ForegroundColor White
Write-Host "Passed: $($results.summary.passed)" -ForegroundColor Green
Write-Host "Failed: $($results.summary.failed)" -ForegroundColor Red
Write-Host "Warnings: $($results.summary.warnings)" -ForegroundColor Yellow
Write-Host ""

$passRate = [math]::Round(($results.summary.passed / $results.summary.total) * 100, 2)
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

# Save results to JSON
$results | ConvertTo-Json -Depth 10 | Out-File $OutputFile
Write-Info "Detailed report saved to: $OutputFile"

# ============================================================================
# RECOMMENDATIONS
# ============================================================================
Write-Section "RECOMMENDATIONS"

if (-not $results.tests.awsCli.credentialsConfigured) {
    Write-Warning "→ Configure AWS credentials: aws configure"
}

if (-not $results.tests.cognito.userPoolExists) {
    Write-Warning "→ Deploy backend to create Cognito User Pool: cd backend; serverless deploy"
}

if (-not $results.tests.dynamodb.allTablesExist) {
    Write-Warning "→ Deploy backend to create DynamoDB tables: cd backend; serverless deploy"
}

if (-not $results.tests.s3.allBucketsExist) {
    Write-Warning "→ Deploy AI services to create S3 buckets: cd ai_services; serverless deploy"
}

if (-not $results.tests.bedrock.accessible) {
    Write-Warning "→ Request Bedrock access in AWS Console (us-east-1 region)"
}

if ($results.tests.apiGateway.backend.url -and -not $results.tests.apiGateway.backend.reachable) {
    Write-Warning "→ Check API Gateway CORS configuration and Lambda function logs"
}

Write-Host ""
Write-Host "Diagnostic complete! Review $OutputFile for detailed results." -ForegroundColor Cyan
Write-Host ""
