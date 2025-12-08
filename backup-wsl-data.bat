@echo off
echo ========================================
echo WSL MySQL and Redis Data Backup Script
echo ========================================
echo.

set BACKUP_DIR=backup-wsl-data
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [1/3] Backing up MySQL database...
wsl -d Ubuntu -u root mysqldump -u root -pqiuyu123 --databases xiuxian > "%BACKUP_DIR%\xiuxian-database.sql"
if %errorlevel% equ 0 (
    echo ✓ MySQL backup completed: %BACKUP_DIR%\xiuxian-database.sql
) else (
    echo ✗ MySQL backup failed
    exit /b 1
)

echo [2/3] Backing up Redis data...
wsl -d Ubuntu -u root redis-cli --rdb /tmp/dump.rdb
wsl -d Ubuntu -u root cp /tmp/dump.rdb /mnt/d/alemon/xiuxian-plugin/%BACKUP_DIR%/redis-dump.rdb
if %errorlevel% equ 0 (
    echo ✓ Redis backup completed: %BACKUP_DIR%\redis-dump.rdb
) else (
    echo ✗ Redis backup failed
    exit /b 1
)

echo [3/3] Creating migration script...
(
echo @echo off
echo ========================================
echo Data Migration Script (WSL to Docker)
echo ========================================
echo.
echo [1/3] Starting Docker services...
docker-compose up -d mysql redis
echo Waiting for services to be healthy...
timeout /t 30 /nobreak > nul
echo.

echo [2/3] Restoring MySQL data...
docker exec -i mysql-xiuxian mysql -u root -pqiuyu123 < "xiuxian-database.sql"
if %errorlevel% equ 0 (
    echo ✓ MySQL data restored successfully
) else (
    echo ✗ MySQL data restore failed
)

echo [3/3] Restoring Redis data...
docker cp "redis-dump.rdb" redis-xiuxian:/data/dump.rdb
docker restart redis-xiuxian
echo ✓ Redis data restored successfully

echo.
echo ========================================
echo Migration completed!
echo ========================================
echo MySQL: root/qiuyu123@localhost:3306/xiuxian
echo Redis: localhost:6379 (password: qiuyu123)
echo.
) > "%BACKUP_DIR%\migrate-to-docker.bat"

echo ✓ Migration script created: %BACKUP_DIR%\migrate-to-docker.bat
echo.
echo ========================================
echo Backup completed!
echo ========================================
echo Next steps:
echo 1. Run %BACKUP_DIR%\migrate-to-docker.bat to migrate data to Docker
echo 2. Update your application configuration
echo 3. Test the new Docker services
echo.
pause