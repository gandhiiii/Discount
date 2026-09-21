@echo off
TITLE Stavya Spine Hospital - Billing Discount Server
cls
echo ================================================================
echo   Stavya Spine Hospital - Local Windows Server Launcher
echo ================================================================
echo.
echo Starting Production Server...
echo.

node "%~dp0server.js"

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Failed to start server. Please ensure Node.js is installed.
  echo.
  pause
)
