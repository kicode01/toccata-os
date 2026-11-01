@echo off
setlocal enabledelayedexpansion
title Toccata OS 1.0 - macOS Setup Assistant (Live Light Mode Preview)

echo ===============================================================================
echo   TOCCATA OS 1.0 - macOS Sequoia Light Mode Setup Assistant Preview
echo   Aesthetics: Porcelain #fbfbfd * Inter Display Font * Bespoke Vector Monograms
echo   Engine: Zero Emojis * Golden Ratio Geometry * Smooth 30ms Progress Bar
echo ===============================================================================
echo.
echo [*] Launching Setup Assistant via WSLg Wayland Direct3D 12...
wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/build/archiso/airootfs/usr/local/bin/toccata-installer"

echo.
echo [*] Setup Assistant closed.
pause
