@echo off
title Construction App
cd /d "%~dp0"

echo ========================================
echo   Construction App - Production Startup
echo ========================================
echo.

:: Check if production build exists
if not exist "frontend\.next\BUILD_ID" (
  echo [!] Production build not found. Building now...
  echo [!] This may take 1-2 minutes...
  cd frontend
  call npm run build
  cd ..
  echo.
  echo [*] Build complete!
  echo.
)

echo [*] Starting backend server and frontend...
start "Construction App Services" cmd /k "npm start"

echo [*] Waiting for services to initialize...
timeout /t 8 /nobreak >nul

echo [*] Opening browser...
start http://localhost:3000

exit
