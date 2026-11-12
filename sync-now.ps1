param (
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = "C:\Users\mahin\.gemini\antigravity\scratch\trading-platform" }
Set-Location $projectRoot

# 1. Locate Git
$git = "C:\Users\mahin\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"
if (-not (Test-Path $git)) {
    $found = (Get-Command git -ErrorAction SilentlyContinue)
    if ($found) { $git = $found.Source }
}
if (-not (Test-Path $git)) {
    Write-Error "Git executable not found."
    exit 1
}

# 2. Load Config
$configFile = Join-Path $projectRoot "automation_config.json"
if (-not (Test-Path $configFile)) {
    Write-Error "automation_config.json not found."
    exit 1
}
$config = Get-Content $configFile -Raw | ConvertFrom-Json

$token = $config.githubToken
$owner = $config.owner
$repo = $config.repo
$branch = if ($config.branch) { $config.branch } else { "main" }

# 3. Check for modifications
$statusOutput = & $git status --porcelain
if (-not $statusOutput) {
    Write-Host "[OK] Working tree clean. All files are already synced to GitHub!" -ForegroundColor Green
    exit 0
}

# 4. Generate Commit Message if not provided
if (-not $Message) {
    $lines = $statusOutput -split "`r?`n" | Where-Object { $_ -match '\S' }
    $fileList = @()
    foreach ($line in $lines) {
        $f = $line.Substring(3).Trim()
        $fileList += (Split-Path $f -Leaf)
    }
    $preview = ($fileList | Select-Object -Unique) -join ", "
    if ($preview.Length -gt 60) { $preview = $preview.Substring(0, 57) + "..." }
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $Message = "Auto-update [$preview] at $timestamp"
}

Write-Host "--> Detected modifications:" -ForegroundColor Cyan
Write-Host $statusOutput -ForegroundColor Gray
Write-Host "--> Staging changes..." -ForegroundColor Cyan
& $git add -A

Write-Host "--> Committing: '$Message'..." -ForegroundColor Cyan
& $git commit -m $Message

Write-Host "--> Pushing to GitHub (https://github.com/$owner/$repo)..." -ForegroundColor Cyan
$remoteAuthUrl = "https://${token}@github.com/$owner/$repo.git"
& $git push $remoteAuthUrl $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] All modifications pushed to GitHub!" -ForegroundColor Green
    Write-Host " Live Site: https://$owner.github.io/$repo/" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Error "Push failed with exit code $LASTEXITCODE."
}
