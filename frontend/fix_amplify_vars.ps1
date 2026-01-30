$ErrorActionPreference = "Stop"
$AppId = "d2jemrwmib4wje"

Write-Host "🚀 Force-Correcting Amplify Variables..." -ForegroundColor Cyan

# The Correct Values
$UserPoolId = "eu-north-1_RfO53Cz5t"
$ClientId = "7g6sqvvnqsg628napds0k73190"

try {
    # We reconstruct the full list to be safe, ensuring USER_POOL_ID is correct
    $envVars = "NEXT_PUBLIC_API_URL=https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_AI_URL=https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_INVENTORY_URL=https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_PAYMENTS_URL=https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev," +
               "NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d3qhkomcxcxmtl.cloudfront.net," +
               "NEXT_PUBLIC_ASSETS_BUCKET=webdpro-assets-dev," +
               "NEXT_PUBLIC_COGNITO_USER_POOL_ID=$UserPoolId," +
               "NEXT_PUBLIC_COGNITO_CLIENT_ID=$ClientId," +
               "NEXT_PUBLIC_COGNITO_DOMAIN=webdpro-auth-prod-2026," +
               "NEXT_PUBLIC_COGNITO_REGION=eu-north-1," +
               "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_A9O3Qt84a8YKnc," +
               "NEXT_PUBLIC_APP_URL=https://main.dfi4inao7jk0t.amplifyapp.com"

    aws amplify update-app --app-id $AppId --environment-variables $envVars --no-cli-pager

    Write-Host "✅ Variables fixed on AWS." -ForegroundColor Green
    Write-Host "   - User Pool ID set to: $UserPoolId (Correct)" -ForegroundColor Gray
    Write-Host "   - Client ID set to:    $ClientId (Correct)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
