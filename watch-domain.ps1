$auth = Get-Content "$env:APPDATA\xdg.data\com.vercel.cli\auth.json" | ConvertFrom-Json
$headers = @{ Authorization = "Bearer " + $auth.token }

for ($i = 0; $i -lt 240; $i++) {
  try {
    Invoke-RestMethod -Uri 'https://api.vercel.com/v9/projects/visucan/domains/visucan.com/verify' -Method POST -Headers $headers -ErrorAction SilentlyContinue | Out-Null
  } catch {}

  try {
    $d = Invoke-RestMethod -Uri 'https://api.vercel.com/v9/projects/visucan/domains/visucan.com' -Headers $headers
    if ($d.verified) {
      Write-Output 'DOMAIN_VERIFIED'
      break
    }
    Write-Output ("check $i : not verified yet")
  } catch {
    Write-Output ("check $i : api error")
  }
  Start-Sleep -Seconds 60
}
