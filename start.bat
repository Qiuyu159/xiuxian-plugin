@echo off
echo ============================================
echo   Xiuxian Plugin Startup Script
echo ============================================
echo.

echo [1/3] Starting Redis service in WSL...
wsl -d Ubuntu sudo service redis-server start
echo ✓ Redis service started (127.0.0.1:6379)

echo [2/3] Starting MySQL service in WSL...
wsl -d Ubuntu sudo service mysql start
echo ✓ MySQL service started (127.0.0.1:3306)

echo [3/3] Starting Xiuxian plugin...
echo.
echo ============================================
echo   Xiuxian Plugin Starting...
echo   GUI Port: 17127
echo   MySQL: root/qiuyu123@xiuxian
echo   Redis: 127.0.0.1:6379
echo ============================================
echo.

yarn dev

echo.
echo ============================================
echo   Xiuxian Plugin has stopped running
echo ============================================
pause