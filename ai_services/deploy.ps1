$envPath = ".env"
if (Test-Path $envPath) {
   Get-Content $envPath | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
      $parts = $_ -split '=', 2
      $name = $parts[0].Trim()
      $value = $parts[1].Trim().Trim('"').Trim("'")
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
      Write-Host "Set $name"
   }
}
else {
   Write-Error ".env file not found!"
   exit 1
}

Write-Host "Starting deployment..."
npx serverless deploy
