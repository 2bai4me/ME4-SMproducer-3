@echo off
setlocal enabledelayedexpansion
echo ============================================
echo   NotebookLM CLI - Login
echo ============================================

:: Check if CDP already running
curl -s --max-time 2 http://localhost:9222/json/version >nul 2>&1
if %errorlevel% equ 0 (
    echo CDP-Port 9222 bereits aktiv. Fuehre Login durch...
    goto login
)

echo.
echo Beende Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starte Chrome mit CDP-Port 9222...
start "Chrome" "C:\Program Files\Google\Chrome\Application\chrome.exe" --profile-directory="Default" --remote-debugging-port=9222 --restore-last-session "https://notebooklm.google.com/"

echo Warte auf Chrome (max 15 Sekunden)...
for /L %%i in (1,1,15) do (
    timeout /t 1 /nobreak >nul
    curl -s --max-time 2 http://localhost:9222/json/version >nul 2>&1
    if !errorlevel! equ 0 (
        echo CDP bereit nach %%i Sekunden.
        timeout /t 2 /nobreak >nul
        goto login
    )
    <nul set /p ="."
)

echo.
echo FEHLER: CDP-Port 9222 nicht erreichbar.
echo Chrome wurde gestartet, aber der Debugging-Port antwortet nicht.
echo Pruefe ob Chrome tatsaechlich laeuft.
pause
exit /b 1

:login
echo.
echo Extrahiere Google-Cookies...
"C:\Users\uwean\AppData\Roaming\Python\Python314\Scripts\nlm.exe" login --provider openclaw --cdp-url http://localhost:9222

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo   ERFOLG! Login abgeschlossen.
    echo ============================================
) else (
    echo.
    echo Login fehlgeschlagen. Fehlercode: %errorlevel%
    echo Stelle sicher, dass du in Chrome bei Google angemeldet bist.
)
pause
