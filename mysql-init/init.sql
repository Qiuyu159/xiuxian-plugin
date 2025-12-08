-- MySQL initialization script for Docker container
-- This script runs when the MySQL container starts for the first time

-- Create the xiuxian database if it doesn't exist
CREATE DATABASE IF NOT EXISTS xiuxian CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to root user from any host
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'qiuyu123';
FLUSH PRIVILEGES;

-- Set default database
USE xiuxian;

-- Create basic tables structure (if needed)
-- Note: Actual data will be restored from backup

SHOW DATABASES;