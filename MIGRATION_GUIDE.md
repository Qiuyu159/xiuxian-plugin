# MySQL和Redis迁移到Docker指南

## 当前状态分析

经过分析，发现以下情况：
1. **WSL Ubuntu中已有数据**：MySQL数据库`xiuxian`和Redis数据库(db1)中有11个键
2. **Docker网络问题**：当前无法从Docker Hub拉取镜像，需要手动解决网络问题
3. **项目配置**：修仙插件使用`@alemonjs/db`包管理数据库连接，通过环境变量配置

## 迁移步骤

### 第一步：解决Docker网络问题

由于无法从Docker Hub拉取镜像，需要：

1. **检查网络连接**：确保网络正常，可以访问Docker Hub
2. **配置Docker镜像源**：使用国内镜像源加速下载
3. **手动下载镜像**：如果网络问题持续，可以手动下载镜像文件

### 第二步：启动Docker服务

一旦网络问题解决，运行：
```bash
docker-compose up -d
```

### 第三步：数据迁移

#### MySQL数据迁移
```sql
# 1. 备份WSL中的MySQL数据
mysqldump -u root -pqiuyu123 xiuxian > xiuxian_backup.sql

# 2. 导入到Docker MySQL
mysql -h localhost -u root -pqiuyu123 xiuxian < xiuxian_backup.sql
```

#### Redis数据迁移
```bash
# 1. 备份WSL中的Redis数据
redis-cli --rdb dump.rdb

# 2. 停止WSL Redis服务
wsl -d Ubuntu sudo service redis-server stop

# 3. 复制RDB文件到Docker Redis数据目录
cp dump.rdb ./redis-data/

# 4. 重启Docker Redis容器
docker-compose restart redis
```

### 第四步：测试连接

使用新的启动脚本测试连接：
```bash
start-docker.bat
```

### 第五步：清理WSL服务

确认Docker服务正常运行后，可以清理WSL中的服务：
```bash
# 停止WSL服务
wsl -d Ubuntu sudo service mysql stop
wsl -d Ubuntu sudo service redis-server stop

# 可选：禁用自动启动
wsl -d Ubuntu sudo systemctl disable mysql
wsl -d Ubuntu sudo systemctl disable redis-server
```

## 配置文件说明

### 已创建的文件

1. **docker-compose.yml** - 包含MySQL和Redis服务的Docker配置
2. **start-docker.bat** - Docker版本的启动脚本
3. **stop-docker.bat** - Docker版本的停止脚本
4. **backup-wsl-data.bat** - 数据备份脚本
5. **mysql-init/init.sql** - MySQL初始化脚本
6. **.env.example** - 环境变量配置示例

### 数据库连接配置

修仙插件通过环境变量配置数据库连接：
- Redis: `localhost:6379` (密码: `qiuyu123`)
- MySQL: `localhost:3306` (用户: `root`, 密码: `qiuyu123`, 数据库: `xiuxian`)

## 故障排除

### Docker网络问题
如果持续遇到网络问题：
1. 检查防火墙设置
2. 配置Docker使用代理
3. 使用离线镜像包

### 数据迁移问题
如果数据迁移失败：
1. 检查数据库连接是否正常
2. 确认备份文件完整性
3. 验证权限设置

## 回滚方案

如果迁移失败，可以回滚到WSL服务：
1. 停止Docker服务：`stop-docker.bat`
2. 启动WSL服务：`start.bat`
3. 恢复原始配置

## 注意事项

1. **数据安全**：迁移前务必备份重要数据
2. **网络依赖**：Docker服务需要稳定的网络连接
3. **资源占用**：Docker容器会占用更多系统资源
4. **兼容性**：确保Docker版本与系统兼容