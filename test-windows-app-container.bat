@echo off
title Toccata OS - Windows App Containerizer Test (Proton / Wine-GE)
cd /d "%~dp0"

echo =======================================================================
echo   Toccata OS - Automated Windows Application Containerizer
echo   Runs .exe and .msi files inside an isolated Linux sandbox via Wine-GE
echo =======================================================================
echo.

if "%~1"=="" (
    echo [INFO] No file dropped. Testing with built-in Windows PE binary inside Linux...
    wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-bundle/toccata-wine-runner.py /usr/lib/wine/x86_64-windows/notepad.exe"
    goto done
)

echo [INFO] Containerizing: %~1
set "TARGET_WIN_PATH=%~1"
for /f "delims=" %%i in ('wsl -d Arch wslpath -u "%TARGET_WIN_PATH%"') do set "TARGET_LINUX_PATH=%%i"

wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-bundle/toccata-wine-runner.py \"%TARGET_LINUX_PATH%\""

:done
echo.
echo Containerization complete! Isolated prefix stored at ~/.local/share/toccata/prefixes/
exit /b 0
