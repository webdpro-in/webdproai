# Phase 1 Setup Verification Script
# This script checks if all Phase 1 configurations are correct

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Check 1: Frontend .env.local
Write-Host "Checking frontend/.env.local..." -ForegroundColor Yellow
if (Test-Path "frontend/.env.local") {
    $frontendEnv = Get-Content "frontend/.env.local" -Raw
    if ($frontendEnv -match 'NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"') {
        Write-Host "  ✓ NEXT_PUBLIC_BACKEND_URL is set to localhost:3001" -ForegroundColor Green
    } else {
        Write-Host "  ✗ NEXT_PUBLIC_BACKEND_URL is not set to localhost:3001" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ✗ frontend/.env.local not found" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 2: Backend .env
Write-Host "Checking backend/.env..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    $backendEnv = Get-Content "backend/.env" -Raw
    if ($backendEnv -match 'AI_USE_BEDROCK=false') {
        Write-Host "  ✓ AI_USE_BEDROCK is set to false" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ AI_USE_BEDROCK is not set to false (may cause timeouts)" -ForegroundColor Yellow
        $warnings++
    }
    
    if ($backendEnv -match 'AI_SERVICE_URL=.*execute-api') {
        Write-Host "  ✓ AI_SERVICE_URL is set to production" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ AI_SERVICE_URL may not be configured correctly" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "  ✗ backend/.env not found" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 3: Backend serverless.yml
Write-Host "Checking backend/serverless.yml..." -ForegroundColor Yellow
if (Test-Path "backend/serverless.yml") {
    $serverlessYml = Get-Content "backend/serverless.yml" -Raw
    
    if ($serverlessYml -match 'serverless-offline:') {
        Write-Host "  ✓ serverless-offline configuration found" -ForegroundColor Green
    } else {
        Write-Host "  ✗ serverless-offline configuration not found" -ForegroundColor Red
        $errors++
    }
    
    if ($serverlessYml -match 'httpPort: 3001') {
        Write-Host "  ✓ httpPort is set to 3001" -ForegroundColor Green
    } else {
        Write-Host "  ✗ httpPort is not set to 3001" -ForegroundColor Red
        $errors++
    }
    
    # Check if authorizer is commented out for generateStore
    if ($serverlessYml -match 'generateStore:[\s\S]*?# authorizer:' -or 
        $serverlessYml -match 'generateStore:[\s\S]*?path: /stores/generate[\s\S]*?method: post(?![\s\S]*?authorizer:)') {
        Write-Host "  ✓ generateStore authorizer is disabled" -ForegroundColor Green
    } else {
        Write-Host "  ✗ generateStore authorizer may still be enabled" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ✗ backend/serverless.yml not found" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 4: Backend package.json
Write-Host "Checking backend/package.json..." -ForegroundColor Yellow
if (Test-Path "backend/package.json") {
    $packageJson = Get-Content "backend/package.json" -Raw
    if ($packageJson -match '"dev:offline".*3001') {
        Write-Host "  ✓ dev:offline script uses port 3001" -ForegroundColor Green
    } else {
        Write-Host "  ✗ dev:offline script does not use port 3001" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ✗ backend/package.json not found" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 5: Node modules
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Write-Host "  ✓ Backend node_modules found" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Backend node_modules not found (run: cd backend && npm install)" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path "frontend/node_modules") {
    Write-Host "  ✓ Frontend node_modules found" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Frontend node_modules not found (run: cd frontend && npm install)" -ForegroundColor Yellow
    $warnings++
}
Write-Host ""

# Check 6: Backend build
Write-Host "Checking backend build..." -ForegroundColor Yellow
if (Test-Path "backend/dist") {
    Write-Host "  ✓ Backend dist folder found" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Backend dist folder not found (run: cd backend && npm run build)" -ForegroundColor Yellow
    $warnings++
}
Write-Host ""

# Check 7: Port availability
Write-Host "Checking port availability..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "  ⚠ Port 3000 is already in use" -ForegroundColor Yellow
    $warnings++
} else {
    Write-Host "  ✓ Port 3000 is available" -ForegroundColor Green
}

if ($port3001) {
    Write-Host "  ⚠ Port 3001 is already in use" -ForegroundColor Yellow
    $warnings++
} else {
    Write-Host "  ✓ Port 3001 is available" -ForegroundColor Green
}
Write-Host ""

# Check 8: AWS Credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
if ($env:AWS_ACCESS_KEY_ID -or (Test-Path "$env:USERPROFILE\.aws\credentials")) {
    Write-Host "  ✓ AWS credentials appear to be configured" -ForegroundColor Green
} else {
    Write-Host "  ⚠ AWS credentials may not be configured" -ForegroundColor Yellow
    $warnings++
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✓ All checks passed! Ready to start Phase 1 testing." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open terminal 1: cd backend && npm run dev:offline" -ForegroundColor White
    Write-Host "2. Open terminal 2: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "3. Navigate to: http://localhost:3000/dashboard/sites/new" -ForegroundColor White
    Write-Host "4. Test website generation" -ForegroundColor White
} elseif ($errors -eq 0) {
    Write-Host "⚠ $warnings warning(s) found. You may proceed but address warnings if issues occur." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Address warnings above (optional)" -ForegroundColor White
    Write-Host "2. Open terminal 1: cd backend && npm run dev:offline" -ForegroundColor White
    Write-Host "3. Open terminal 2: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "4. Navigate to: http://localhost:3000/dashboard/sites/new" -ForegroundColor White
} else {
    Write-Host "✗ $errors error(s) and $warnings warning(s) found. Please fix errors before proceeding." -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the errors above and run this script again." -ForegroundColor Yellow
}
Write-Host ""
