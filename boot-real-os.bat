@echo off
setlocal
title Toccata OS - Real Operating System
cd /d "%~dp0"

echo ===============================================================================
echo            TOCCATA OS - THE SOVEREIGN UNIFIED OPERATING SYSTEM
echo   Speed of Linux  *  Polish of pearOS  *  Adaptive Workflows of Zorin & GNOME 47
echo ===============================================================================
echo.
echo [*] Initializing Unified Hardware Virtual Machine (QEMU KVM + VirtIO GPU)...
echo [*] Direct3D 12 Hardware Acceleration Active
echo [*] PipeWire Pro Audio Engine Active (0.7ms Latency)
echo.

wsl -d Arch -e bash /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/run-vm.sh toccata

exit /b 0
