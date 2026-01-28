# DNS Fix Script for AWS Connectivity
# Run as Administrator

Write-Host "AWS DNS Connectivity Fix" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Show current DNS
Write-Host "Current DNS Settings:" -ForegroundColor Yellow
Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | ForEach-Object {
    Write-Host "  $($_.InterfaceAlias): $($_.ServerAddresses -join ', ')"
}
Write-Host ""

# Step 2: Test DNS Resolution
Write-Host "Testing AWS DNS Resolution:" -ForegroundColor Yellow
$testHost = "apigateway.eu-north-1.amazonaws.com"
try {
    $result = Resolve-DnsName $testHost -ErrorAction Stop
    Write-Host "  SUCCESS: $testHost resolved" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Cannot resolve $testHost" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Change your DNS servers" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 - Use Google DNS (Recommended):" -ForegroundColor Cyan
    Write-Host "  Run PowerShell as Administrator, then:" -ForegroundColor White
    Write-Host '  Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {' -ForegroundColor Gray
    Write-Host '    Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ("8.8.8.8","8.8.4.4")' -ForegroundColor Gray
    Write-Host '  }' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2 - Use Cloudflare DNS:" -ForegroundColor Cyan
    Write-Host "  Run PowerShell as Administrator, then:" -ForegroundColor White
    Write-Host '  Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {' -ForegroundColor Gray
    Write-Host '    Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ("1.1.1.1","1.0.0.1")' -ForegroundColor Gray
    Write-Host '  }' -ForegroundColor Gray
    Write-Host ""
    Write-Host "After changing DNS, run:" -ForegroundColor Cyan
    Write-Host "  ipconfig /flushdns" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Active Network Adapters:" -ForegroundColor Yellow
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | ForEach-Object {
    Write-Host "  - $($_.Name) ($($_.InterfaceDescription))" -ForegroundColor White
}
