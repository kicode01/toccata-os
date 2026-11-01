@echo off
setlocal
title Toccata OS - Maestro AI On-Device Assistant
cd /d "%~dp0"

echo ===============================================================================
echo   TOCCATA OS - Maestro On-Device Neural Assistant (Phase 5)
echo   100%% Offline * Zero Telemetry Guarantee * Natural Language System Control
echo ===============================================================================
echo.
echo [*] Initializing Maestro Engine and Wayland display surface...
echo [*] Short-cuts: Press Ctrl+M or click the Maestro Orb in the top bar.
echo.

wsl -d Arch -e python3 -c "import sys, os; sys.path.insert(0, '/mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-shell'); sys.path.insert(0, '/mnt/c/Users/PC/Desktop/rnd/p3os/core/toccata-ai'); from PyQt6.QtWidgets import QApplication; from maestro_hud import MaestroHUD; app = QApplication(sys.argv); hud = MaestroHUD(None); hud.show(); sys.exit(app.exec())"

exit /b 0
