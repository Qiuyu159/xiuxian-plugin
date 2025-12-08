import * as fs from 'fs';
import * as path from 'path';

// 装备状态接口
interface EquipmentStatus {
    equipped: boolean;
    equippedTo: string | null;
    equippedBy: string | null;
    equippedTime: string | null;
}

// 装备映射数据接口
interface EquipmentMappingData {
    uniqueId: number;
    itemId: string;
    playerId: string;
    registeredTime: string;
    equipped: boolean;
    equippedTo: string | null;
    equippedBy: string | null;
    equippedTime: string | null;
    [key: string]: any;
}

// 装备映射管理器 - 独立管理装备唯一ID映射
export class EquipmentMappingManager {
    private equipmentMappingPath: string;
    private equipmentMapping: { [key: number]: EquipmentMappingData };
    private nextId: number;
    private availableIds: number[];

    constructor() {
        this.equipmentMappingPath = path.join(__dirname, 'data', 'Equipment.json');
        this.equipmentMapping = {};
        this.nextId = 1; // 下一个可用的ID
        this.availableIds = []; // 可重用的空ID
        this.loadEquipmentMapping();
    }

    // 加载装备映射数据
    private loadEquipmentMapping(): void {
        try {
            if (fs.existsSync(this.equipmentMappingPath)) {
                const data = fs.readFileSync(this.equipmentMappingPath, 'utf8');
                this.equipmentMapping = JSON.parse(data);
                
                // 计算下一个可用的ID和可重用的空ID
                this.calculateNextId();
            }
        } catch (error) {
            console.error('加载装备映射数据失败:', error);
            this.equipmentMapping = {};
            this.nextId = 1;
            this.availableIds = [];
        }
    }

    // 计算下一个可用的ID和可重用的空ID
    private calculateNextId(): void {
        const existingIds = Object.keys(this.equipmentMapping).map(id => parseInt(id));
        
        if (existingIds.length === 0) {
            this.nextId = 1;
            this.availableIds = [];
            return;
        }

        const maxId = Math.max(...existingIds);
        const allIds = Array.from({length: maxId}, (_, i) => i + 1);
        
        // 找出缺失的ID（可重用的空ID）
        this.availableIds = allIds.filter(id => !existingIds.includes(id));
        
        // 下一个ID是最大ID+1，或者如果有可重用的ID则使用最小的可重用ID
        if (this.availableIds.length > 0) {
            this.availableIds.sort((a, b) => a - b);
        } else {
            this.nextId = maxId + 1;
        }
    }

    // 保存装备映射数据
    private saveEquipmentMapping(): void {
        try {
            const dir = path.dirname(this.equipmentMappingPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.equipmentMappingPath, JSON.stringify(this.equipmentMapping, null, 2), 'utf8');
        } catch (error) {
            console.error('保存装备映射数据失败:', error);
        }
    }

    // 注册装备
    registerEquipment(playerId: string, itemId: string, equipmentData: any = {}): number {
        const uniqueId = this.generateSequentialId();
        
        this.equipmentMapping[uniqueId] = {
            uniqueId: uniqueId,
            itemId: itemId,
            playerId: playerId,
            registeredTime: new Date().toISOString(),
            equipped: false,
            equippedTo: null,
            equippedBy: null,
            equippedTime: null,
            ...equipmentData
        };

        this.saveEquipmentMapping();
        return uniqueId;
    }

    // 生成顺序ID（从1开始，重用空ID）
    private generateSequentialId(): number {
        if (this.availableIds.length > 0) {
            // 优先使用可重用的空ID
            return this.availableIds.shift()!;
        } else {
            // 使用新的ID
            const newId = this.nextId;
            this.nextId++;
            return newId;
        }
    }

    // 获取装备信息
    getEquipmentInfo(uniqueId: number): EquipmentMappingData | null {
        return this.equipmentMapping[uniqueId] || null;
    }

    // 获取玩家所有装备
    getPlayerEquipment(playerId: string): EquipmentMappingData[] {
        return Object.values(this.equipmentMapping).filter(
            equipment => equipment.playerId === playerId
        );
    }

    // 删除装备
    deleteEquipment(uniqueId: number): boolean {
        if (this.equipmentMapping[uniqueId]) {
            delete this.equipmentMapping[uniqueId];
            
            // 将删除的ID添加到可重用列表中
            if (uniqueId > 0) {
                this.availableIds.push(uniqueId);
                this.availableIds.sort((a, b) => a - b);
            }
            
            this.saveEquipmentMapping();
            return true;
        }
        return false;
    }

    // 更新装备状态
    updateEquipmentStatus(uniqueId: number, statusUpdate: Partial<EquipmentMappingData>): boolean {
        if (this.equipmentMapping[uniqueId]) {
            this.equipmentMapping[uniqueId] = {
                ...this.equipmentMapping[uniqueId],
                ...statusUpdate
            };
            this.saveEquipmentMapping();
            return true;
        }
        return false;
    }

    // 获取当前ID状态信息（用于调试）
    getIdStatus(): { nextId: number; availableIds: number[]; totalEquipment: number } {
        return {
            nextId: this.nextId,
            availableIds: this.availableIds,
            totalEquipment: Object.keys(this.equipmentMapping).length
        };
    }
}

// 导出单例实例
export const equipmentMappingManager = new EquipmentMappingManager();