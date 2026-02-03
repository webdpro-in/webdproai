# Test Backend Health Endpoint
Write-Host "Testing WebDPro Backend Health..." -ForegroundColor Cyan

$backendUrl = "https://93vhhkyxx7.execute-api.eu-north-1.amazonaws.com"

Write-Host "`nTesting health endpoint: $backendUrl/health" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -UseBasicParsing
    Write-Host "✅ Backend is healthy!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend health check failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "Backend API Endpoints:" -ForegroundColor Cyan
Write-Host "  Auth: $backendUrl/auth/*" -ForegroundColor White
Write-Host "  Stores: $backendUrl/stores/*" -ForegroundColor White
Write-Host "  Orders: $backendUrl/orders/*" -ForegroundColor White
Write-Host "  Health: $backendUrl/health" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Update Google Cloud Console with callback URLs (see DEPLOYMENT_SUMMARY.md)" -ForegroundColor White
Write-Host "2. Update AWS Amplify environment variables (see AMPLIFY_ENV_VARIABLES.md)" -ForegroundColor White
Write-Host "3. Test locally: cd frontend && npm run dev" -ForegroundColor White
Write-Host "4. Visit http://localhost:3000 and test Google login" -ForegroundColor White
