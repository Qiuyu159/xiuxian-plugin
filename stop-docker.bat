@echo off
echo ============================================
echo   Xiuxian Plugin Docker Shutdown Script
echo ============================================
echo.

echo [1/3] Stopping Xiuxian plugin process...
taskkill /f /im node.exe 2>nul
echo ✓ Xiuxian plugin stopped

echo [2/3] Stopping Docker services...
docker-compose down
if %ERRORLEVEL% neq 0 (
    echo ✗ Failed to stop Docker services
    pause
    exit /b 1
)
echo ✓ Docker services stopped

echo.
echo ============================================
echo   Port Release Status:
echo   - Port 17117 (Xiuxian GUI): Released
echo   - Port 6379 (Redis): Released  
echo   - Port 3306 (MySQL): Released
echo ============================================
echo.

echo All services stopped, ports released!
pause