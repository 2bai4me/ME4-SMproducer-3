@echo off
cd /d "C:\Users\uwean\Entwicklung\ME4-SMproducer-3\Code"

echo ===========================================
echo   ME4-SMproducer Start
echo ===========================================

echo.
echo [1/2] Express Backend (Port 3001)...
start "Express" cmd /k "cd /d C:\Users\uwean\Entwicklung\ME4-SMproducer-3\Code\services\smproducer-pipeline && echo Starte Express... && node src\server.js"

echo [2/2] Vite Frontend (Port 5173)...
start "Vite" cmd /k "cd /d C:\Users\uwean\Entwicklung\ME4-SMproducer-3\Code && echo Starte Vite... && npx vite --port 5173"

echo.
echo Warte 5 Sekunden...
timeout /t 5 /nobreak >nul

echo Öffne Browser...
start http://localhost:5173

echo.
echo ===========================================
echo   Express: localhost:3001
echo   Vite:    localhost:5173
echo ===========================================
pause
