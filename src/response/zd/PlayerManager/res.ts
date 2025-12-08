// 玩家管理类 - TypeScript版本

interface PlayerInfo {
    name: string;
    money: number;
    level: number;
    experience: number;
    [key: string]: any;
}

class PlayerManager {
    private playerData: { [playerId: string]: PlayerInfo };
    private readonly PLAYER_DATA_FILE: string;

    constructor() {
        this.playerData = {};
        this.PLAYER_DATA_FILE = 'data/player_data.json';
        this.loadPlayerData();
    }

    // 加载玩家数据
    private loadPlayerData(): void {
        try {
            // 这里需要根据实际的文件系统API进行调整
            // 假设有文件系统访问能力
            const data = this.readFileSync(this.PLAYER_DATA_FILE);
            if (data) {
                this.playerData = JSON.parse(data);
            } else {
                // 初始化默认玩家数据
                this.playerData = {
                    'test_player_001': {
                        name: '测试玩家',
                        money: 10000, // 初始货币
                        level: 1,
                        experience: 0
                    }
                };
                this.savePlayerData();
            }
        } catch (error) {
            console.error('加载玩家数据失败:', error);
            this.playerData = {};
        }
    }

    // 保存玩家数据
    private savePlayerData(): void {
        try {
            const data = JSON.stringify(this.playerData, null, 2);
            this.writeFileSync(this.PLAYER_DATA_FILE, data);
        } catch (error) {
            console.error('保存玩家数据失败:', error);
        }
    }

    // 获取玩家信息
    getPlayer(playerId: string): PlayerInfo {
        if (!this.playerData[playerId]) {
            // 如果玩家不存在，创建新玩家
            this.playerData[playerId] = {
                name: playerId,
                money: 1000, // 默认初始货币
                level: 1,
                experience: 0
            };
            this.savePlayerData();
        }
        return this.playerData[playerId];
    }

    // 更新玩家货币
    updatePlayerMoney(playerId: string, amount: number): number {
        const player = this.getPlayer(playerId);
        player.money += amount;
        
        // 确保货币不为负数
        if (player.money < 0) {
            player.money = 0;
        }
        
        this.savePlayerData();
        return player.money;
    }

    // 获取玩家货币
    getPlayerMoney(playerId: string): number {
        const player = this.getPlayer(playerId);
        return player.money;
    }

    // 检查玩家是否有足够货币
    hasEnoughMoney(playerId: string, amount: number): boolean {
        const player = this.getPlayer(playerId);
        return player.money >= amount;
    }

    // 创建新玩家
    createPlayer(playerId: string, playerInfo: Partial<PlayerInfo> = {}): PlayerInfo {
        if (this.playerData[playerId]) {
            throw new Error(`玩家 ${playerId} 已存在`);
        }
        
        this.playerData[playerId] = {
            name: playerInfo.name || playerId,
            money: playerInfo.money || 1000,
            level: playerInfo.level || 1,
            experience: playerInfo.experience || 0,
            ...playerInfo
        };
        
        this.savePlayerData();
        return this.playerData[playerId];
    }

    // 获取所有玩家
    getAllPlayers(): { [playerId: string]: PlayerInfo } {
        return this.playerData;
    }

    // 文件系统辅助方法（需要根据实际环境实现）
    private readFileSync(filePath: string): string | null {
        // 这里需要根据实际的文件系统API实现
        // 例如使用Node.js的fs模块或其他文件系统API
        try {
            // 伪代码，实际实现取决于运行环境
            return null;
        } catch (error) {
            return null;
        }
    }

    private writeFileSync(filePath: string, data: string): void {
        // 这里需要根据实际的文件系统API实现
        // 例如使用Node.js的fs模块或其他文件系统API
        try {
            // 伪代码，实际实现取决于运行环境
        } catch (error) {
            throw error;
        }
    }
}

// 创建单例实例
export const playerManager = new PlayerManager();