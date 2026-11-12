@echo off
title MAHESH NEXORA MARKETS - Auto Sync Watcher
echo Starting Auto-Sync Watcher for MAHESH NEXORA MARKETS...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoExit -File "%~dp0auto-watch-sync.ps1"
