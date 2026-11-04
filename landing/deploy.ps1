# Deploy the Elitze landing page to Vercel, served on elitze.info
#
# Why the app host matters:
#   elitze.info currently resolves to Vercel (216.198.79.1) and /dashboard answers 308,
#   so the workspace app is live on SOME deployment alias. This landing project owns "/"
#   and proxies the app paths to that alias. Point it at a dead host and the app 404s.
#
#   Find the real alias:  npx vercel ls        (pick the workspace project's production URL)
#                    or:  Vercel dashboard -> workspace project -> Domains
#
# Usage (PowerShell, from this folder):
#   .\deploy.ps1 -AppHost my-workspace-prod.vercel.app

param(
  [Parameter(Mandatory = $true)]
  [string]$AppHost
)

$ErrorActionPreference = "Stop"
$AppHost = $AppHost -replace "^https?://", "" -replace "/$", ""

Write-Host "`n[1/6] Validating app host: $AppHost" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "https://$AppHost/" -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
  $code = $resp.StatusCode
} catch {
  $code = [int]$_.Exception.Response.StatusCode.value__
  if (-not $code) { $code = 0 }
}
if ($code -eq 404 -or $code -eq 0) {
  Write-Host "  FAIL: https://$AppHost/ returned $code — that is not a live deployment." -ForegroundColor Red
  Write-Host "  Run 'npx vercel ls' or open the Vercel dashboard and copy the production domain." -ForegroundColor Yellow
  exit 1
}
Write-Host "  OK: https://$AppHost/ answered $code" -ForegroundColor Green

Write-Host "`n[2/6] Writing app host into vercel.json" -ForegroundColor Cyan
$json = Get-Content vercel.json -Raw
$json = $json -replace "YOUR-APP-HOST\.vercel\.app", $AppHost
Set-Content -Path vercel.json -Value $json -Encoding UTF8
$parsed = $json | ConvertFrom-Json
Write-Host "  rewrites now: $($parsed.rewrites.Count) -> https://$AppHost"

Write-Host "`n[3/6] Vercel CLI" -ForegroundColor Cyan
npx --yes vercel@latest --version

Write-Host "`n[4/6] Sign in (browser opens once)" -ForegroundColor Cyan
npx --yes vercel@latest login

Write-Host "`n[5/6] Link this folder to a NEW project named elitze-landing" -ForegroundColor Cyan
npx --yes vercel@latest link

Write-Host "`n[6/6] Deploy to production, then attach the domain" -ForegroundColor Cyan
npx --yes vercel@latest deploy --prod

Write-Host "`nIf elitze.info is still attached to the workspace project, Vercel will refuse to add it here." -ForegroundColor Yellow
Write-Host "  1) Workspace project -> Settings -> Domains -> remove elitze.info (keep the *.vercel.app alias)"
Write-Host "  2) Then run:  npx vercel domains add elitze.info elitze-landing"
Write-Host "  3) Then run:  npx vercel domains add www.elitze.info elitze-landing`n"

Write-Host "Verify in order:" -ForegroundColor Green
Write-Host "  a) https://elitze-landing.vercel.app/            -> landing page"
Write-Host "  b) https://elitze-landing.vercel.app/dashboard   -> proxied workspace (should NOT 404)"
Write-Host "  c) https://elitze.info/                          -> landing page after the domain move"
Write-Host "  d) https://elitze.info/dashboard                 -> workspace, unchanged`n"

Write-Host "Rollback: in Vercel, move the domain back to the workspace project — nothing in that repo changed." -ForegroundColor DarkGray
