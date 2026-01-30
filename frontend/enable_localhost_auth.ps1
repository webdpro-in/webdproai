$ErrorActionPreference = "Stop"

$AppId = "d2jemrwmib4wje"
$UserPoolId = "eu-north-1_RfO53Cz5t"
$ClientId = "7g6sqvvnqsg628napds0k73190"
$AmplifyUrl = "https://main.dfi4inao7jk0t.amplifyapp.com"
$CustomUrl = "https://webdpro.in"
$LocalUrl = "http://localhost:3000"

Write-Host "🚀 Starting AWS Configuration Update (Adding Localhost)..." -ForegroundColor Cyan

# 1. Update Cognito User Pool Client
Write-Host "running: Updating Cognito Callback URLs (Adding Localhost)..." -ForegroundColor Yellow
try {
    # Combine all URLs
    $CallBacks = "$CustomUrl/auth/callback,$AmplifyUrl/auth/callback,$LocalUrl/auth/callback"
    $LogoutUrls = "$CustomUrl/auth/logout,$AmplifyUrl/auth/logout,$LocalUrl/auth/logout"

    aws cognito-idp update-user-pool-client `
        --user-pool-id $UserPoolId `
        --client-id $ClientId `
        --callback-urls $CallBacks `
        --logout-urls $LogoutUrls `
        --supported-identity-providers Google `
        --allowed-o-auth-flows code `
        --allowed-o-auth-scopes email openid profile `
        --allowed-o-auth-flows-user-pool-client `
        --no-cli-pager
    
    Write-Host "✅ Cognito configuration updated successfully." -ForegroundColor Green
    Write-Host "   - Added: $LocalUrl/auth/callback" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error updating Cognito: $_" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Localhost support added." -ForegroundColor Cyan
