@echo off
title Sync MAHESH NEXORA MARKETS to GitHub
echo ==========================================================
echo  MAHESH NEXORA MARKETS - INSTANT GITHUB SYNC
echo ==========================================================
echo.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0sync-now.ps1"
echo.
pause
