$ErrorActionPreference = "Stop"

$UserPoolId = "eu-north-1_RfO53Cz5t"
$ClientId = "7g6sqvvnqsg628napds0k73190"

$AmplifyUrl = "https://main.dfi4inao7jk0t.amplifyapp.com"
$CustomUrl = "https://webdpro.in"
$LocalUrl = "http://localhost:3000"

# Note: For AWS CLI in PowerShell, use distinct arguments for list items
# OR pass them as a space-separated string if the CLI expects it.
# standard AWS CLI syntax for list is: --option value1 value2 value3

Write-Host "🚀 Fixing Cognito Callback URLs..." -ForegroundColor Cyan

# Define URLs as individual variables for clarity
$Call1 = "$CustomUrl/auth/callback"
$Call2 = "$AmplifyUrl/auth/callback"
$Call3 = "$LocalUrl/auth/callback"

$Out1 = "$CustomUrl/auth/logout"
$Out2 = "$AmplifyUrl/auth/logout"
$Out3 = "$LocalUrl/auth/logout"

try {
    # We pass them as separate arguments to the parameter
    aws cognito-idp update-user-pool-client `
        --user-pool-id $UserPoolId `
        --client-id $ClientId `
        --callback-urls $Call1 $Call2 $Call3 `
        --logout-urls $Out1 $Out2 $Out3 `
        --supported-identity-providers Google `
        --allowed-o-auth-flows code `
        --allowed-o-auth-scopes email openid profile `
        --allowed-o-auth-flows-user-pool-client `
        --no-cli-pager
    
    Write-Host "✅ Cognito configuration fixed." -ForegroundColor Green
} catch {
    Write-Host "❌ Error updating Cognito: $_" -ForegroundColor Red
}
