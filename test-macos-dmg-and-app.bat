@echo off
setlocal enabledelayedexpansion
title Toccata OS 1.0 - macOS DMG Mounter & Darling Subsystem Test

echo ===============================================================================
echo   TOCCATA OS 1.0 - macOS DMG Mounter & Darling Subsystem Integration Test
echo   Target: Transparent .dmg Disk Mounting + Mach-O Darling Subsystem Parity
echo ===============================================================================
echo.
echo [*] Generating fresh test Apple Disk Image (SampleMacApp.dmg)...
wsl -d Arch -e python3 /mnt/c/Users/PC/Desktop/rnd/p3os/scripts/make-sample-dmg.py
echo.
echo [*] Launching Cadence Finder in WSLg graphical session...
echo [*] INSTRUCTIONS TO TEST:
echo     1. Cadence will open showing 'SampleMacApp.dmg' with a disc icon.
echo     2. Double-click 'SampleMacApp.dmg' to mount the virtual volume.
echo     3. Observe the sidebar display: '💿 SampleMacApp [⏏]' under Mounted Volumes.
echo     4. Inside the volume, double-click 'SampleMacApp.app' to open the macOS Installer Sheet.
echo     5. Right-click 'SampleMacApp.app' to inspect 'Show Package Contents'.
echo     6. Test launching the Mach-O binary to see the Darling Darwin runner dialog.
echo     7. Click '[⏏]' in the sidebar to eject and unmount the virtual volume.
echo.
wsl -d Arch -e bash -c "export DISPLAY=:0; export WAYLAND_DISPLAY=wayland-0; export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir; python3 /mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-shell/apps/cadence.py /mnt/c/Users/PC/Desktop/rnd/p3os"

echo.
echo [*] Session completed.
pause
