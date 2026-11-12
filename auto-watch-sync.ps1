<#
.SYNOPSIS
    Continuous Auto-Sync Daemon for MAHESH NEXORA MARKETS
.DESCRIPTION
    Continuously monitors the project directory. As soon as any file modification,
    addition, or deletion is detected, it automatically bundles the changes,
    creates a timestamped git commit, and pushes to GitHub.
#>

param (
    [Parameter(Mandatory=$false)]
    [int]$IntervalSeconds = 5
)

$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = "C:\Users\mahin\.gemini\antigravity\scratch\trading-platform" }
Set-Location $projectRoot

$syncScript = Join-Path $projectRoot "sync-now.ps1"
$configFile = Join-Path $projectRoot "automation_config.json"

if (-not (Test-Path $configFile)) {
    Write-Error "automation_config.json not found."
    exit 1
}

$config = Get-Content $configFile -Raw | ConvertFrom-Json
$git = "C:\Users\mahin\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MAHESH NEXORA MARKETS - CONTINUOUS AUTO-SYNC ENGINE" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Project:   $projectRoot" -ForegroundColor Gray
Write-Host " Target:    https://github.com/$($config.owner)/$($config.repo)" -ForegroundColor Gray
Write-Host " Interval:  Every $IntervalSeconds seconds" -ForegroundColor Gray
Write-Host " Status:    [ACTIVE] Continuous background sync running..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    Start-Sleep -Seconds $IntervalSeconds

    try {
        $status = & $git status --porcelain
        if ($status) {
            $timeStr = (Get-Date).ToString("HH:mm:ss")
            Write-Host "[$timeStr] Modifications detected! Syncing to GitHub..." -ForegroundColor Yellow
            
            & powershell -ExecutionPolicy Bypass -File $syncScript

            Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Synced. Resuming monitor..." -ForegroundColor Green
            Write-Host ""
        }
    } catch {
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Watcher check notice: $($_.Exception.Message)" -ForegroundColor Red
    }
}
