$ErrorActionPreference = "Stop"

$AppId = "d2jemrwmib4wje"
$UserPoolId = "eu-north-1_RfO53Cz5t"
$ClientId = "7g6sqvvnqsg628napds0k73190"
# Using the Amplify URL as requested
$AmplifyUrl = "https://main.dfi4inao7jk0t.amplifyapp.com"
$CustomUrl = "https://webdpro.in"

Write-Host "🚀 Starting AWS Configuration Update (Adding Amplify URL)..." -ForegroundColor Cyan

# 1. Update Cognito User Pool Client
Write-Host "running: Updating Cognito Callback URLs (Adding Amplify URL)..." -ForegroundColor Yellow
try {
    # Note: Callback URLs must be comma-separated without spaces in basic CLI, strictly follows string
    $CallBacks = "$CustomUrl/auth/callback,$AmplifyUrl/auth/callback"
    $LogoutUrls = "$CustomUrl/auth/logout,$AmplifyUrl/auth/logout"

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
    Write-Host "   - Added: $AmplifyUrl/auth/callback" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error updating Cognito: $_" -ForegroundColor Red
}

# 2. Update Amplify Environment Variables
Write-Host "running: Updating Amplify Environment Variables..." -ForegroundColor Yellow
try {
    # Define variables map
    # Setting NEXT_PUBLIC_APP_URL to the Amplify URL as primary for now
    $envVars = "NEXT_PUBLIC_API_URL=https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_AI_URL=https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_INVENTORY_URL=https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_PAYMENTS_URL=https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d3qhkomcxcxmtl.cloudfront.net," +
               "NEXT_PUBLIC_ASSETS_BUCKET=webdpro-assets-dev," +
               "NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-north-1_RfO53Cz5t," +
               "NEXT_PUBLIC_COGNITO_CLIENT_ID=7g6sqvvnqsg628napds0k73190," +
               "NEXT_PUBLIC_COGNITO_DOMAIN=webdpro-auth-prod-2026," +
               "NEXT_PUBLIC_COGNITO_REGION=eu-north-1," +
               "NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key-id>," +
               "NEXT_PUBLIC_APP_URL=$AmplifyUrl"

    aws amplify update-app --app-id $AppId --environment-variables $envVars --no-cli-pager

    Write-Host "✅ Amplify Environment Variables updated successfully." -ForegroundColor Green
    Write-Host "   - Set NEXT_PUBLIC_APP_URL=$AmplifyUrl" -ForegroundColor Gray
    Write-Host "⚠️  Please REDEPLOY your app in the Amplify Console for these changes to take effect." -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error updating Amplify: $_" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Configuration process completed." -ForegroundColor Cyan
