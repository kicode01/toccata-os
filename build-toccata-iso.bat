@echo off
setlocal enabledelayedexpansion
title Toccata OS 1.0 - Bare-Metal ISO Builder (archiso)

echo ===============================================================================
echo   TOCCATA OS 1.0 - Bare-Metal Bootable ISO Generator (archiso)
echo   Target: toccata-os-x86_64.iso  *  UEFI systemd-boot + BIOS Syslinux Hybrid
echo ===============================================================================
echo.
echo   [1] Validate ISO Profile, Bootloaders, and Package Manifest (Fast Pre-Flight)
echo   [2] Test Run Toccata macOS Setup Assistant / Installer (Live UI Preview)
echo   [3] Compile Complete Bootable ISO (Runs mkarchiso in Arch Linux Engine)
echo   [4] Exit
echo.
set /p choice="Select an option [1-4] (Default is 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo [*] Running archiso pre-flight validation...
    wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/build/build-iso.sh --validate
    echo.
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo [*] Launching Toccata macOS Setup Assistant in live preview mode via WSLg...
    wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/build/archiso/airootfs/usr/local/bin/toccata-installer"
    exit /b 0
)

if "%choice%"=="3" (
    echo.
    echo [*] Starting full mkarchiso compilation...
    echo [*] Note: This downloads required packages into pacman cache and compresses squashfs.
    echo [*] Output will be written to: c:\Users\PC\Desktop\rnd\p3os\dist\
    echo.
    wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/build/build-iso.sh build
    echo.
    pause
    exit /b 0
)

exit /b 0
