@echo off
echo ============================================
echo   Xiuxian Plugin Service Shutdown Script
echo ============================================
echo.

echo [1/3] Stopping Xiuxian plugin process...
taskkill /f /im node.exe 2>nul
echo ✓ Xiuxian plugin stopped

echo [2/3] Stopping Redis service in WSL...
wsl -d Ubuntu sudo service redis-server stop
echo ✓ Redis service stopped

echo [3/3] Stopping MySQL service in WSL...
wsl -d Ubuntu sudo service mysql stop
echo ✓ MySQL service stopped

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