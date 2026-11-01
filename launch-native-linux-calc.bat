@echo off
title Launching Toccata Native Linux Calculator (WSLg Wayland)...
cd /d "%~dp0"

echo =======================================================================
echo   Launching Native Linux GUI App via WSLg Direct3D 12 vGPU Pipeline...
echo =======================================================================
echo.

wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-bundle/toccata-calc.py"

exit /b 0
