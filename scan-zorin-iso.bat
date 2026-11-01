@echo off
setlocal enabledelayedexpansion
title Toccata OS - Zorin OS Design Asset Extractor

echo ===============================================================================
echo   TOCCATA OS - Zorin OS Design & Asset Extractor
echo   Extract Themes, Icons, Wallpapers, Sounds, and Layout Configurations
echo ===============================================================================
echo.
echo   [1] Scan and Extract from a Local Zorin OS ISO (.iso file)
echo   [2] Fetch Official Zorin OS Design Repositories Directly from Upstream (GitHub)
echo   [3] Exit
echo.
set /p choice="Select an option [1-3] (Default is 2): "
if "%choice%"=="" set choice=2

if "%choice%"=="1" (
    echo.
    set /p isopath="Enter the full path to your Zorin OS .iso file: "
    if "!isopath!"=="" (
        echo [!] No path provided.
        pause
        exit /b 1
    )
    echo.
    echo [*] Scanning and extracting from: !isopath! ...
    wsl -d Arch -e python3 /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/extract-zorin-design.py "!isopath!"
    echo.
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo [*] Fetching official Zorin OS themes, icons, and layout engines directly...
    wsl -d Arch -e python3 /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/extract-zorin-design.py --upstream
    echo.
    pause
    exit /b 0
)

exit /b 0
