# Test AWS Connectivity Script
Write-Host "Testing AWS Connectivity..." -ForegroundColor Cyan

# Test DNS Resolution
Write-Host "`n1. Testing DNS Resolution..." -ForegroundColor Yellow
$dnsTests = @(
    "apigateway.eu-north-1.amazonaws.com",
    "lambda.eu-north-1.amazonaws.com",
    "s3.eu-north-1.amazonaws.com",
    "dynamodb.eu-north-1.amazonaws.com"
)

foreach ($host in $dnsTests) {
    try {
        $result = Resolve-DnsName $host -ErrorAction Stop
        Write-Host "  ✓ $host resolved to $($result[0].IPAddress)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $host failed to resolve" -ForegroundColor Red
    }
}

# Test HTTPS Connectivity
Write-Host "`n2. Testing HTTPS Connectivity..." -ForegroundColor Yellow
$httpsTests = @(
    "https://apigateway.eu-north-1.amazonaws.com",
    "https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev"
)

foreach ($url in $httpsTests) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✓ $url is reachable (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $url failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test AWS CLI
Write-Host "`n3. Testing AWS CLI..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ AWS CLI is working" -ForegroundColor Green
        Write-Host "  Identity: $identity"
    } else {
        Write-Host "  ✗ AWS CLI failed: $identity" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ AWS CLI not configured or not working" -ForegroundColor Red
}

# Check DNS Settings
Write-Host "`n4. Current DNS Settings..." -ForegroundColor Yellow
Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | ForEach-Object {
    Write-Host "  Interface: $($_.InterfaceAlias)" -ForegroundColor Cyan
    Write-Host "  DNS Servers: $($_.ServerAddresses -join ', ')" -ForegroundColor White
}

Write-Host "`n5. Recommendations..." -ForegroundColor Yellow
Write-Host "  If DNS resolution failed, try:" -ForegroundColor White
Write-Host "    1. Change DNS to Google DNS (8.8.8.8, 8.8.4.4)" -ForegroundColor Gray
Write-Host "    2. Flush DNS cache: ipconfig /flushdns" -ForegroundColor Gray
Write-Host "    3. Check firewall/antivirus settings" -ForegroundColor Gray
Write-Host "    4. Try mobile hotspot if on corporate network" -ForegroundColor Gray

Write-Host "`nTest complete!" -ForegroundColor Cyan
