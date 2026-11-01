@echo off
setlocal
title Toccata OS - Cutefish Native Qt6 Shell (WSLg)

echo ===============================================================================
echo   TOCCATA OS - Cutefish Qt6 Native Wayland Desktop Shell (Tier 2 WSLg)
echo   Direct3D 12 vGPU Accelerated  *  macOS Sequoia Frosted Glass Vibrancy
echo ===============================================================================
echo.
echo [*] Initializing Wayland socket and Direct3D 12 display pipeline...
echo [*] Launching Top Menu Bar, Floating Dock, Spotlight, and Control Center...
echo.

wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; export PULSE_SERVER=/mnt/wslg/PulseServer; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-shell/toccata-shell.py"

exit /b 0
