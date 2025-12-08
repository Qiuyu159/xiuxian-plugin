@echo off
echo ============================================
echo   Xiuxian Plugin Docker Startup Script
echo ============================================
echo.

echo [1/3] Starting Docker services...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo ✗ Failed to start Docker services
    pause
    exit /b 1
)
echo ✓ Docker services started

echo [2/3] Waiting for services to be ready...
timeout /t 5 /nobreak >nul
echo ✓ Services are ready

echo [3/3] Starting Xiuxian plugin...
echo.
echo ============================================
echo   Xiuxian Plugin Starting...
echo   GUI Port: 17127
echo   MySQL: root/qiuyu123@xiuxian (localhost:3306)
echo   Redis: qiuyu123@localhost:6379
echo   Using Docker containers
echo ============================================
echo.

set REDIS_HOST=localhost
set REDIS_PORT=6379
set REDIS_PASSWORD=qiuyu123
set REDIS_DB=0
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set MYSQL_USER=root
set MYSQL_PASSWORD=qiuyu123
set MYSQL_DATABASE=xiuxian

yarn dev

echo.
echo ============================================
echo   Xiuxian Plugin has stopped running
echo ============================================
pause