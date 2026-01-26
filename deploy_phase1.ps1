# WebDPro Phase 1 Deployment Script

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting WebDPro Phase 1 Backend Deployment..." -ForegroundColor Green

# 1. Inventory Service
Write-Host "`n📦 Deploying Inventory Service..." -ForegroundColor Cyan
Push-Location inventory
try {
   npm install
   npm run deploy
   Write-Host "✅ Inventory Deployed" -ForegroundColor Green
}
catch {
   Write-Error "❌ Inventory Deployment Failed"
}
finally {
   Pop-Location
}

# 2. Orders Service
Write-Host "`n📦 Deploying Orders Service..." -ForegroundColor Cyan
Push-Location orders
try {
   npm install
   npm run deploy
   Write-Host "✅ Orders Deployed" -ForegroundColor Green
}
catch {
   Write-Error "❌ Orders Deployment Failed"
}
finally {
   Pop-Location
}

# 3. Payments Service
Write-Host "`n📦 Deploying Payments Service..." -ForegroundColor Cyan
Push-Location payments
try {
   npm install
   npm run deploy
   Write-Host "✅ Payments Deployed" -ForegroundColor Green
}
catch {
   Write-Error "❌ Payments Deployment Failed"
}
finally {
   Pop-Location
}

# 4. AI Services
Write-Host "`n📦 Deploying AI Services..." -ForegroundColor Cyan
Push-Location ai_services
try {
   npm install
   npm run deploy
   Write-Host "✅ AI Services Deployed" -ForegroundColor Green
}
catch {
   Write-Error "❌ AI Services Deployment Failed"
}
finally {
   Pop-Location
}

Write-Host "`n✨ Phase 1 Deployment Complete!" -ForegroundColor Green
Write-Host "Next Step: Start Phase 2 (Merchant Dashboard)" -ForegroundColor Yellow
