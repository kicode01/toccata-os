@echo off
setlocal EnableDelayedExpansion
title Toccata OS - Real Operating System Launcher
cd /d "%~dp0"

echo ===============================================================================
echo            TOCCATA OS - REAL OPERATING SYSTEM (NOT HTML)
echo   Direct3D 12 Hardware Accelerated  *  KVM Virtualization  *  WSLg Native
echo ===============================================================================
echo.
echo Choose how you want to experience the Real OS:
echo.
echo   [1] Boot pearOS NiceC0re Live OS in Hardware VM (QEMU KVM)
echo       Full real Arch Linux + Cupertino macOS frosted glass desktop!
echo.
echo   [2] Boot Zorin OS 18.1 Core Live OS in Hardware VM (QEMU KVM)
echo       Full real Ubuntu/Debian + Zorin GNOME Adaptive Workflows!
echo.
echo   [3] Launch Native Qt6 Wayland Shell (Desktop Mode in Windows)
echo       Direct native Linux binaries (Menu Bar, Dock, Control Center, Settings,
echo       Cadence Files, Scribe, Wine Windows app bridge) via WSLg Direct3D 12.
echo.
echo   [4] Build and Boot Fresh Toccata OS Bootable Bare-Metal ISO
echo       Compiles the master Arch Linux ISO with all extracted themes and boots it!
echo.
echo ===============================================================================
set /p "CHOICE=Enter choice [1, 2, 3, or 4]: "

if "%CHOICE%"=="1" (
    echo.
    echo [*] Starting pearOS NiceC0re in hardware VM (4 vCPUs, 4GB RAM, VirtIO GPU)...
    wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/run-vm.sh pearos
    goto done
)

if "%CHOICE%"=="2" (
    echo.
    echo [*] Starting Zorin OS 18.1 in hardware VM (4 vCPUs, 4GB RAM, VirtIO GPU)...
    wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/run-vm.sh zorin
    goto done
)

if "%CHOICE%"=="3" (
    echo.
    echo [*] Starting Native Qt6 Wayland Shell on WSLg Direct3D 12...
    start "" launch-native-shell.bat
    goto done
)

if "%CHOICE%"=="4" (
    echo.
    echo [*] Building master Toccata OS ISO (archiso) with all themes and extensions...
    wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/build/build-iso.sh build
    echo [*] Booting generated Toccata OS ISO in VM...
    wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/run-vm.sh toccata
    goto done
)

echo [!] Invalid selection.
:done
exit /b 0
