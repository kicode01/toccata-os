@echo off
title Launching Toccata OS...
cd /d "%~dp0"

echo =======================================================================
echo   Starting Toccata OS - Apple macOS Polish on High-Speed Linux Engine
echo =======================================================================
echo.

set "PREVIEW_URL=file:///%CD:\=/%/desktop/preview/index.html"

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo [INFO] Found Google Chrome. Launching Frameless Native Desktop Window...
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="%PREVIEW_URL%" --start-maximized --disable-features=Translate --disable-http-cache
    goto launched
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo [INFO] Found Microsoft Edge. Launching Frameless Native Desktop Window...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="%PREVIEW_URL%" --start-maximized --disable-features=Translate --disable-http-cache
    goto launched
)

echo [INFO] Launching in Default Browser...
start "" "%PREVIEW_URL%"

:launched
echo.
echo [TIPS FOR THE BEST EXPERIENCE]:
echo   1. Press F11 at any time to enter 100%% True Full-Screen OS Mode!
echo   2. Press Cmd+Space (or Ctrl+Space) to invoke Spotlight Search.
echo   3. Press Spacebar on any selected file in Cadence for Instant Quick Look.
echo   4. Click anywhere or press any key to engage Low-Latency Acoustic Audio.
echo.
exit /b 0
