@echo off
title Construction App - Stop Server
echo ========================================
echo   Construction App - Stopping Server
echo ========================================
echo.

echo [*] Killing all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

if %errorlevel% == 0 (
    echo [+] Server stopped successfully.
) else (
    echo [!] No Node.js processes found. Server may already be stopped.
)

echo.
pause
