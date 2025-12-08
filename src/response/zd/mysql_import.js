import { createConnection } from 'mysql2/promise';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MySQL连接配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'xiuxian_plugin'
};

// 表结构定义
const tableSchemas = {
    tianfu: `
        CREATE TABLE IF NOT EXISTS tianfu (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100),
            quality VARCHAR(20),
            description TEXT,
            effects JSON
        )
    `,
    equipment: `
        CREATE TABLE IF NOT EXISTS equipment (
            id INT PRIMARY KEY,
            uniqueId INT,
            itemId INT,
            playerId VARCHAR(100),
            registeredTime DATETIME,
            equipped BOOLEAN DEFAULT FALSE,
            equippedTo VARCHAR(100),
            equippedBy VARCHAR(100),
            equippedTime DATETIME,
            name VARCHAR(255),
            type VARCHAR(50),
            quality VARCHAR(20)
        )
    `,
    bag: `
        CREATE TABLE IF NOT EXISTS bag (
            id INT PRIMARY KEY,
            itemId INT,
            playerId VARCHAR(100),
            count INT DEFAULT 1,
            name VARCHAR(255),
            type VARCHAR(50),
            quality VARCHAR(20)
        )
    `,
    goods: `
        CREATE TABLE IF NOT EXISTS goods (
            id INT PRIMARY KEY,
            name VARCHAR(255),
            type VARCHAR(50),
            quality VARCHAR(20),
            price DECIMAL(10,2),
            description TEXT
        )
    `,
    menpai: `
        CREATE TABLE IF NOT EXISTS menpai (
            id INT PRIMARY KEY,
            name VARCHAR(100),
            description TEXT,
            skills JSON
        )
    `,
    miji: `
        CREATE TABLE IF NOT EXISTS miji (
            id INT PRIMARY KEY,
            name VARCHAR(255),
            type VARCHAR(50),
            level INT,
            description TEXT,
            effects JSON
        )
    `,
    player: `
        CREATE TABLE IF NOT EXISTS player (
            id INT PRIMARY KEY,
            name VARCHAR(100),
            level INT,
            exp BIGINT,
            hp INT,
            mp INT,
            attack INT,
            defense INT,
            skills JSON
        )
    `,
    player_data: `
        CREATE TABLE IF NOT EXISTS player_data (
            id INT PRIMARY KEY,
            playerId VARCHAR(100),
            dataType VARCHAR(50),
            dataValue JSON,
            updateTime DATETIME
        )
    `,
    zhuangbei: `
        CREATE TABLE IF NOT EXISTS zhuangbei (
            id INT PRIMARY KEY,
            name VARCHAR(255),
            type VARCHAR(50),
            quality VARCHAR(20),
            attributes JSON,
            requirements JSON
        )
    `,
    canye: `
        CREATE TABLE IF NOT EXISTS canye (
            id INT PRIMARY KEY,
            name VARCHAR(255),
            type VARCHAR(50),
            effect TEXT,
            duration INT
        )
    `
};

async function importData() {
    let connection;
    try {
        // 创建数据库连接
        connection = await createConnection(dbConfig);
        console.log('成功连接到MySQL数据库');

        // 创建表
        for (const [tableName, schema] of Object.entries(tableSchemas)) {
            await connection.execute(schema);
            console.log(`表 ${tableName} 创建成功`);
        }

        // 导入数据
        const dataFiles = [
            'tianfu', 'equipment', 'bag', 'goods', 'menpai', 
            'miji', 'player', 'player_data', 'zhuangbei', 'canye'
        ];

        for (const fileName of dataFiles) {
            try {
                const filePath = join(__dirname, fileName, 'res.ts');
                const fileContent = await readFile(filePath, 'utf8');
                
                // 解析JSON数据（移除TypeScript的export语句）
                const jsonData = JSON.parse(fileContent.replace(/^export default |;$/, ''));
                
                if (Array.isArray(jsonData) && jsonData.length > 0) {
                    const tableName = fileName === 'equipment' ? 'equipment' : fileName;
                    
                    for (const item of jsonData) {
                        // 处理嵌套结构（如tianfu数据）
                        const dataToInsert = item.tianfu ? item.tianfu : item;
                        
                        if (Array.isArray(dataToInsert)) {
                            // 处理嵌套数组结构
                            for (const subItem of dataToInsert) {
                                await insertData(connection, tableName, subItem);
                            }
                        } else {
                            await insertData(connection, tableName, dataToInsert);
                        }
                    }
                    
                    console.log(`数据文件 ${fileName} 导入成功，共导入 ${jsonData.length} 条记录`);
                }
            } catch (error) {
                console.log(`导入 ${fileName} 数据时出错:`, error.message);
            }
        }

        console.log('所有数据导入完成！');

    } catch (error) {
        console.error('导入过程中出错:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function insertData(connection, tableName, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT IGNORE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    
    try {
        await connection.execute(sql, values);
    } catch (error) {
        console.log(`插入数据到 ${tableName} 时出错:`, error.message);
    }
}

// 运行导入脚本
importData().catch(console.error);