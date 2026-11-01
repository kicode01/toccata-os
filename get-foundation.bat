@echo off
title Fetching Toccata OS Foundations (Arch Linux Base)...
cd /d "%~dp0"

echo =======================================================================
echo   Toccata OS - Downloading Arch Linux & SteamOS Base Foundation
echo =======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\fetch-foundation.ps1"

echo.
pause
