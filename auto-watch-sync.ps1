<#
.SYNOPSIS
    Real-Time Automatic File Watcher & GitHub Sync Engine for MAHESH NEXORA MARKETS
.DESCRIPTION
    Monitors all code and asset files in the project. Whenever any modification is saved,
    it automatically bundles the changes, creates a timestamped git commit, and pushes
    straight to GitHub without any manual intervention.
#>

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
$debounceSeconds = if ($config.debounceSeconds) { [int]$config.debounceSeconds } else { 5 }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MAHESH NEXORA MARKETS - LIVE AUTO-SYNC ENGINE" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Project:   $projectRoot" -ForegroundColor Gray
Write-Host " Target:    https://github.com/$($config.owner)/$($config.repo)" -ForegroundColor Gray
Write-Host " Debounce:  $debounceSeconds seconds" -ForegroundColor Gray
Write-Host " Status:    [ACTIVE] Watching for file changes..." -ForegroundColor Green
Write-Host " (Press Ctrl+C to stop the watcher anytime)" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$ignoredPatterns = @(
    "\\\.git\\",
    "automation_config\.json",
    "\.log$",
    "\.tmp$",
    "\.zip$",
    "server\.ps1",
    "auto-watch-sync\.ps1"
)

$script:pendingChanges = $false
$script:changedFiles = [System.Collections.Generic.HashSet[string]]::new()
$script:lastChangeTime = [DateTime]::MinValue

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType

    # Check if path should be ignored
    $isIgnored = $false
    foreach ($pat in $ignoredPatterns) {
        if ($path -match $pat) {
            $isIgnored = $true
            break
        }
    }

    if (-not $isIgnored) {
        $fileName = Split-Path $path -Leaf
        $script:changedFiles.Add($fileName) | Out-Null
        $script:pendingChanges = $true
        $script:lastChangeTime = [DateTime]::Now
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Detected $changeType : $fileName (Sync queued in ${debounceSeconds}s)..." -ForegroundColor Yellow
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

try {
    while ($true) {
        Start-Sleep -Milliseconds 1000

        if ($script:pendingChanges) {
            $elapsed = ([DateTime]::Now - $script:lastChangeTime).TotalSeconds
            if ($elapsed -ge $debounceSeconds) {
                $script:pendingChanges = $false
                $summaryList = ($script:changedFiles | Select-Object -Unique) -join ", "
                $script:changedFiles.Clear()

                Write-Host ""
                Write-Host "----------------------------------------------------------" -ForegroundColor DarkCyan
                Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Auto-triggering push for: $summaryList" -ForegroundColor Cyan
                Write-Host "----------------------------------------------------------" -ForegroundColor DarkCyan

                try {
                    & powershell -ExecutionPolicy Bypass -File $syncScript -Message "Auto-sync [$summaryList] at $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
                } catch {
                    Write-Host "Sync error: $($_.Exception.Message)" -ForegroundColor Red
                }

                Write-Host ""
                Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Watching for next changes..." -ForegroundColor Green
            }
        }
    }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Get-EventSubscriber | Unregister-Event
    Write-Host "Watcher stopped." -ForegroundColor Yellow
}
