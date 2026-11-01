@echo off
setlocal
title Toccata OS - Hardware & Driver Compatibility Inspector

echo ===============================================================================
echo   TOCCATA OS - Hardware & Driver Compatibility Inspector
echo   Scanning Host Silicon: CPU, GPU, Wi-Fi 6E, Bluetooth, and PipeWire Audio
echo ===============================================================================
echo.

wsl -d Arch -e python3 /mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-compat/toccata-hardware-check.py

echo.
pause
exit /b 0
