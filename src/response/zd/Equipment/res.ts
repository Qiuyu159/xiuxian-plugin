// 装备管理类 - TypeScript版本
import * as fs from 'fs';
import * as path from 'path';
import { BagManager } from '../bag/res';
import { EquipmentMappingManager } from '../EquipmentMappingManager/res';

// 装备项接口
export interface EquipmentItem {
  id: string;
  uniqueId: string;
  name: string;
  type: string;
  quality: string;
  quantity: number;
  equipped: boolean;
  equippedTo: string | null;
  equippedTime: string | null;
}

// 装备指令解析结果接口
export interface EquipmentCommandResult {
  success: boolean;
  error?: string;
  equipmentUniqueId?: string;
  pieceName?: string;
}

// 装备操作结果接口
export interface EquipmentOperationResult {
  success: boolean;
  message: string;
}

// 装备状态更新接口
export interface EquipmentStatus {
  equipped: boolean;
  equippedTo: string | null;
  equippedBy: string | null;
  equippedTime: string | null;
}

// 棋子接口
export interface Piece {
  name: string;
  id: string;
}

// 装备管理类
export class EquipmentManager {
  private equipmentDataPath: string;
  private userDataPath: string;
  private equipmentData: any;
  private userData: any;

  constructor() {
    this.equipmentDataPath = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'zhuangbei.json');
    this.userDataPath = path.join(__dirname, '..', '..', '..', '..', '..', 'user.ts');
    this.loadData();
  }

  // 加载数据
  private loadData(): void {
    try {
      // 加载装备数据
      if (fs.existsSync(this.equipmentDataPath)) {
        this.equipmentData = JSON.parse(fs.readFileSync(this.equipmentDataPath, 'utf8'));
      } else {
        this.equipmentData = {};
      }

      // 加载用户数据（用于棋子信息）
      if (fs.existsSync(this.userDataPath)) {
        // 在TypeScript中，我们需要使用import动态加载
        // 这里暂时设为空对象，实际使用时需要动态导入
        this.userData = {};
      } else {
        this.userData = {};
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.equipmentData = {};
      this.userData = {};
    }
  }

  // 解析装备指令
  parseEquipmentCommand(command: string): EquipmentCommandResult {
    // 支持格式: #装备装备代号*队伍内棋子名字
    const pattern = /^#装备\s*(\S+)\s*\*\s*(\S+)$/;
    const match = command.match(pattern);

    if (!match) {
      return { success: false, error: '指令格式错误，请使用: #装备装备代号*队伍内棋子名字' };
    }

    const equipmentUniqueId = match[1].trim();
    const pieceName = match[2].trim();

    return {
      success: true,
      equipmentUniqueId,
      pieceName
    };
  }

  // 处理装备指令
  async equipItem(playerId: string, command: string): Promise<EquipmentOperationResult> {
    try {
      // 解析指令
      const parsed = this.parseEquipmentCommand(command);

      if (!parsed.success) {
        return { success: false, message: parsed.error || '指令解析失败' };
      }

      const { equipmentUniqueId, pieceName } = parsed;

      if (!equipmentUniqueId || !pieceName) {
        return { success: false, message: '装备代号或棋子名称为空' };
      }

      // 验证装备是否存在
      const equipmentInfo = EquipmentMappingManager.getEquipmentInfo(equipmentUniqueId);

      if (!equipmentInfo) {
        return { success: false, message: `装备代号 ${equipmentUniqueId} 不存在` };
      }

      // 验证装备是否属于该玩家
      const playerBag = BagManager.getPlayerBag(playerId);
      const equipmentItem = playerBag['装备'].find((item: EquipmentItem) => item.uniqueId === equipmentUniqueId
      );

      if (!equipmentItem) {
        return { success: false, message: `装备 ${equipmentUniqueId} 不在你的背包中` };
      }

      // 验证棋子是否存在
      const piece = await this.findPieceInTeam(playerId, pieceName);

      if (!piece) {
        return { success: false, message: `棋子 ${pieceName} 不在你的队伍中` };
      }

      // 检查装备是否已装备
      if (equipmentItem.equipped) {
        return { success: false, message: `装备 ${equipmentItem.name} 已经装备在其他角色上` };
      }

      // 检查棋子是否已装备同类型装备
      const existingEquip = this.findEquipmentOnPiece(playerId, pieceName, equipmentItem.type);

      if (existingEquip) {
        // 先卸下现有装备
        await this.unequipItem(playerId, existingEquip.uniqueId);
      }

      // 装备物品
      equipmentItem.equipped = true;
      equipmentItem.equippedTo = pieceName;
      equipmentItem.equippedTime = new Date().toISOString();

      // 更新装备映射
      EquipmentMappingManager.updateEquipmentStatus(equipmentUniqueId, {
        equipped: true,
        equippedTo: pieceName,
        equippedBy: playerId,
        equippedTime: equipmentItem.equippedTime
      });

      // 保存数据
      BagManager.saveBagData();

      return {
        success: true,
        message: `成功将 ${equipmentItem.name} 装备给 ${pieceName}`
      };
    } catch (error) {
      console.error('装备物品失败:', error);

      return { success: false, message: '装备物品时发生错误' };
    }
  }

  // 卸下装备
  async unequipItem(playerId: string, equipmentUniqueId: string): Promise<EquipmentOperationResult> {
    try {
      // 验证装备是否存在
      const equipmentInfo = EquipmentMappingManager.getEquipmentInfo(equipmentUniqueId);

      if (!equipmentInfo) {
        return { success: false, message: `装备代号 ${equipmentUniqueId} 不存在` };
      }

      // 验证装备是否属于该玩家
      const playerBag = BagManager.getPlayerBag(playerId);
      const equipmentItem = playerBag['装备'].find((item: EquipmentItem) => item.uniqueId === equipmentUniqueId
      );

      if (!equipmentItem) {
        return { success: false, message: `装备 ${equipmentUniqueId} 不在你的背包中` };
      }

      if (!equipmentItem.equipped) {
        return { success: false, message: `装备 ${equipmentItem.name} 未装备` };
      }

      // 卸下装备
      equipmentItem.equipped = false;
      const equippedTo = equipmentItem.equippedTo;

      equipmentItem.equippedTo = null;
      equipmentItem.equippedTime = null;

      // 更新装备映射
      EquipmentMappingManager.updateEquipmentStatus(equipmentUniqueId, {
        equipped: false,
        equippedTo: null,
        equippedBy: null,
        equippedTime: null
      });

      // 保存数据
      BagManager.saveBagData();

      return {
        success: true,
        message: `成功从 ${equippedTo} 卸下 ${equipmentItem.name}`
      };
    } catch (error) {
      console.error('卸下装备失败:', error);

      return { success: false, message: '卸下装备时发生错误' };
    }
  }

  // 查找队伍中的棋子
  private async findPieceInTeam(playerId: string, pieceName: string): Promise<Piece | null> {
    try {
      // 这里需要根据实际的用户数据结构来查找棋子
      // 假设user.ts中有getUserTeam方法
      if (this.userData.getUserTeam) {
        const team = await this.userData.getUserTeam(playerId);

        return team.find((piece: Piece) => piece.name === pieceName) || null;
      }

      // 如果没有用户数据模块，返回模拟数据
      return { name: pieceName, id: `piece_${pieceName}` };
    } catch (error) {
      console.error('查找棋子失败:', error);

      return null;
    }
  }

  // 查找棋子身上的装备
  private findEquipmentOnPiece(playerId: string, pieceName: string, equipmentType: string | null = null): EquipmentItem | null {
    const playerBag = BagManager.getPlayerBag(playerId);
    const equippedItems = playerBag['装备'].filter((item: EquipmentItem) => item.equipped && item.equippedTo === pieceName
    );

    if (equipmentType) {
      return equippedItems.find((item: EquipmentItem) => item.type === equipmentType) || null;
    }

    return equippedItems.length > 0 ? equippedItems[0] : null;
  }

  // 获取棋子装备列表
  getPieceEquipment(playerId: string, pieceName: string): EquipmentItem[] {
    const playerBag = BagManager.getPlayerBag(playerId);

    return playerBag['装备'].filter((item: EquipmentItem) => item.equipped && item.equippedTo === pieceName
    );
  }

  // 获取玩家所有装备的棋子
  getEquippedPieces(playerId: string): { [pieceName: string]: EquipmentItem[] } {
    const playerBag = BagManager.getPlayerBag(playerId);
    const equippedItems = playerBag['装备'].filter((item: EquipmentItem) => item.equipped);

    const pieces: { [pieceName: string]: EquipmentItem[] } = {};

    equippedItems.forEach(item => {
      if (!pieces[item.equippedTo!]) {
        pieces[item.equippedTo!] = [];
      }
      pieces[item.equippedTo!].push(item);
    });

    return pieces;
  }

  // 生成装备唯一ID（与bag.ts保持一致）
  generateEquipmentUniqueId(itemId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    return `${itemId}_${timestamp}_${random}`;
  }

  // 注册装备（当玩家获得装备时调用）
  registerEquipment(playerId: string, itemId: string, equipmentData: any = {}): any {
    return EquipmentMappingManager.registerEquipment(playerId, itemId, equipmentData);
  }

  // 获取玩家所有装备
  getPlayerEquipment(playerId: string): any[] {
    return EquipmentMappingManager.getPlayerEquipment(playerId);
  }

  // 删除装备（当装备被售卖或提交任务时调用）
  deleteEquipment(uniqueId: string): boolean {
    return EquipmentMappingManager.deleteEquipment(uniqueId);
  }

  // 批量操作
  batchUnequip(playerId: string, pieceName: string | null = null): number {
    const playerBag = BagManager.getPlayerBag(playerId);
    let unequippedCount = 0;

    playerBag['装备'].forEach((item: EquipmentItem) => {
      if (item.equipped && (!pieceName || item.equippedTo === pieceName)) {
        item.equipped = false;
        item.equippedTo = null;
        item.equippedTime = null;
        unequippedCount++;

        // 更新装备映射
        EquipmentMappingManager.updateEquipmentStatus(item.uniqueId, {
          equipped: false,
          equippedTo: null,
          equippedBy: null,
          equippedTime: null
        });
      }
    });

    if (unequippedCount > 0) {
      BagManager.saveBagData();
    }

    return unequippedCount;
  }
}

// 导出单例实例
export const equipmentManager = new EquipmentManager();
