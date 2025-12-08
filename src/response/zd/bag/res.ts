// 背包类 - TypeScript版本
import * as fs from 'fs';
import * as path from 'path';
import { EquipmentMappingManager } from '../EquipmentMappingManager/res';

// 物品类型分类映射
const ITEM_CATEGORIES: { [category: string]: string[] } = {
  // 装备类别
  '装备': ['剑', '刀', '拳', '棍', '扇', '针匣', '手杖', '衣服', '鞋子', '饰品', '神器'],
  
  // 消耗类别
  '消耗': ['配方', '菜肴', '丹药', '可用杂物', '粮食'],
  
  // 武学类别
  '武学': ['秘籍', '天书', '残章'],
  
  // 材料类别
  '材料': ['书画', '花卉', '化妆品', '酒类', '矿石', '烹饪材料', '药材', '音律', '游戏'],
  
  // 任务类别
  '任务': ['酒馆', '任务', '藏宝图', '生活道具', '杂物']
};

// 背包物品接口
export interface BagItem {
  id: string;
  uniqueId?: string;
  name: string;
  type: string;
  quality: string;
  quantity: number;
  maxStack?: number;
  equipped?: boolean;
  equippedTo?: string | null;
}

// 背包分类接口
export interface BagCategory {
  [category: string]: BagItem[];
}

// 背包数据结构接口
export interface BagData {
  [playerId: string]: BagCategory;
}

// 物品信息接口
export interface ItemInfo {
  id: string;
  name: string;
  type: string;
  quality: string;
  maxStack?: number;
}

// 背包信息接口
export interface BagInfo {
  totalItems: number;
  categories: {
    [category: string]: {
      count: number;
      totalQuantity: number;
    };
  };
}

// 背包类
export class BagManager {
  private bagDataPath: string;
  private goodsDataPath: string;
  private equipmentDataPath: string;
  private equipmentMappingPath: string;
  private bagData: BagData;
  private goodsData: ItemInfo[];
  private equipmentData: any;
  private equipmentMapping: any;

  constructor() {
    this.bagDataPath = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'bag.json');
    this.goodsDataPath = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'goods.json');
    this.equipmentDataPath = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'zhuangbei.json');
    this.equipmentMappingPath = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'Equipment.json');
    this.loadData();
  }

  // 加载数据
  private loadData(): void {
    try {
      // 加载背包数据
      if (fs.existsSync(this.bagDataPath)) {
        this.bagData = JSON.parse(fs.readFileSync(this.bagDataPath, 'utf8'));
      } else {
        this.bagData = {};
        this.saveBagData();
      }

      // 加载物品数据
      if (fs.existsSync(this.goodsDataPath)) {
        const goodsData = JSON.parse(fs.readFileSync(this.goodsDataPath, 'utf8'));
        this.goodsData = goodsData.goods || [];
      } else {
        this.goodsData = [];
      }

      // 加载装备数据
      if (fs.existsSync(this.equipmentDataPath)) {
        this.equipmentData = JSON.parse(fs.readFileSync(this.equipmentDataPath, 'utf8'));
      } else {
        this.equipmentData = {};
      }

      // 加载装备映射数据
      if (fs.existsSync(this.equipmentMappingPath)) {
        this.equipmentMapping = JSON.parse(fs.readFileSync(this.equipmentMappingPath, 'utf8'));
      } else {
        this.equipmentMapping = {};
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.bagData = {};
      this.goodsData = [];
      this.equipmentData = {};
      this.equipmentMapping = {};
    }
  }

  // 保存背包数据
  saveBagData(): void {
    try {
      const dir = path.dirname(this.bagDataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.bagDataPath, JSON.stringify(this.bagData, null, 2), 'utf8');
    } catch (error) {
      console.error('保存背包数据失败:', error);
    }
  }

  // 获取物品分类
  getItemCategory(itemType: string): string {
    for (const [category, types] of Object.entries(ITEM_CATEGORIES)) {
      if (types.includes(itemType)) {
        return category;
      }
    }
    return '其他';
  }

  // 获取玩家背包
  getPlayerBag(playerId: string): BagCategory {
    if (!this.bagData[playerId]) {
      this.bagData[playerId] = {
        '装备': [],
        '消耗': [],
        '武学': [],
        '材料': [],
        '任务': []
      };
    }
    return this.bagData[playerId];
  }

  // 添加物品到背包
  addItem(playerId: string, itemId: string, quantity: number = 1, uniqueId: string | null = null): boolean {
    const playerBag = this.getPlayerBag(playerId);
    
    // 查找物品信息
    const itemInfo = this.goodsData.find(item => item.id === itemId);
    if (!itemInfo) {
      console.error(`物品ID ${itemId} 不存在`);
      return false;
    }

    const category = this.getItemCategory(itemInfo.type);
    
    if (!playerBag[category]) {
      playerBag[category] = [];
    }

    // 如果是装备且有唯一ID
    if (category === '装备' && uniqueId) {
      const equipmentItem: BagItem = {
        id: itemId,
        uniqueId: uniqueId,
        name: itemInfo.name,
        type: itemInfo.type,
        quality: itemInfo.quality,
        quantity: 1,
        equipped: false,
        equippedTo: null
      };
      playerBag[category].push(equipmentItem);
    } else {
      // 检查是否已存在相同物品
      const existingItem = playerBag[category].find(item => 
        item.id === itemId && !item.uniqueId
      );
      
      if (existingItem && itemInfo.maxStack && itemInfo.maxStack > 1) {
        // 可堆叠物品
        existingItem.quantity += quantity;
        if (existingItem.quantity > itemInfo.maxStack) {
          existingItem.quantity = itemInfo.maxStack;
        }
      } else {
        // 新物品或不可堆叠物品
        const newItem: BagItem = {
          id: itemId,
          name: itemInfo.name,
          type: itemInfo.type,
          quality: itemInfo.quality,
          quantity: quantity,
          maxStack: itemInfo.maxStack || 1
        };
        playerBag[category].push(newItem);
      }
    }

    this.saveBagData();
    return true;
  }

  // 从背包移除物品
  removeItem(playerId: string, itemId: string, quantity: number = 1, uniqueId: string | null = null): boolean {
    const playerBag = this.getPlayerBag(playerId);
    
    // 查找物品信息
    const itemInfo = this.goodsData.find(item => item.id === itemId);
    if (!itemInfo) {
      console.error(`物品ID ${itemId} 不存在`);
      return false;
    }

    const category = this.getItemCategory(itemInfo.type);
    
    if (!playerBag[category]) {
      console.error(`玩家 ${playerId} 的 ${category} 分类不存在`);
      return false;
    }

    if (uniqueId) {
      // 通过唯一ID移除装备
      const itemIndex = playerBag[category].findIndex(item => 
        item.uniqueId === uniqueId
      );
      
      if (itemIndex !== -1) {
        playerBag[category].splice(itemIndex, 1);
        this.saveBagData();
        return true;
      }
    } else {
      // 通过物品ID移除
      const itemIndex = playerBag[category].findIndex(item => 
        item.id === itemId && !item.uniqueId
      );
      
      if (itemIndex !== -1) {
        const item = playerBag[category][itemIndex];
        if (item.quantity > quantity) {
          item.quantity -= quantity;
        } else {
          playerBag[category].splice(itemIndex, 1);
        }
        this.saveBagData();
        return true;
      }
    }

    console.error(`物品 ${itemId} 在玩家 ${playerId} 的背包中不存在`);
    return false;
  }

  // 获取背包物品列表
  getBagItems(playerId: string, category: string | null = null): BagItem[] {
    const playerBag = this.getPlayerBag(playerId);
    
    if (category) {
      return playerBag[category] || [];
    }
    
    // 返回所有分类的物品
    const allItems: BagItem[] = [];
    Object.values(playerBag).forEach(categoryItems => {
      allItems.push(...categoryItems);
    });
    return allItems;
  }

  // 查找物品
  findItem(playerId: string, itemId: string, uniqueId: string | null = null): BagItem | null {
    const playerBag = this.getPlayerBag(playerId);
    
    for (const category of Object.values(playerBag)) {
      if (uniqueId) {
        const item = category.find(item => item.uniqueId === uniqueId);
        if (item) return item;
      } else {
        const item = category.find(item => item.id === itemId && !item.uniqueId);
        if (item) return item;
      }
    }
    
    return null;
  }

  // 获取背包容量信息
  getBagInfo(playerId: string): BagInfo {
    const playerBag = this.getPlayerBag(playerId);
    const info: BagInfo = {
      totalItems: 0,
      categories: {}
    };

    for (const [category, items] of Object.entries(playerBag)) {
      const categoryInfo = {
        count: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
      };
      info.categories[category] = categoryInfo;
      info.totalItems += categoryInfo.totalQuantity;
    }

    return info;
  }

  // 清空玩家背包
  clearBag(playerId: string): void {
    this.bagData[playerId] = {
      '装备': [],
      '消耗': [],
      '武学': [],
      '材料': [],
      '任务': []
    };
    this.saveBagData();
  }

  // 转移物品到其他玩家
  transferItem(fromPlayerId: string, toPlayerId: string, itemId: string, quantity: number = 1, uniqueId: string | null = null): boolean {
    // 先从源玩家背包移除
    if (this.removeItem(fromPlayerId, itemId, quantity, uniqueId)) {
      // 再添加到目标玩家背包
      return this.addItem(toPlayerId, itemId, quantity, uniqueId);
    }
    return false;
  }

  // 生成装备唯一ID
  generateEquipmentUniqueId(itemId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${itemId}_${timestamp}_${random}`;
  }

  // 添加装备到背包（自动生成唯一ID）
  addEquipment(playerId: string, itemId: string): string | null {
    const uniqueId = this.generateEquipmentUniqueId(itemId);
    const success = this.addItem(playerId, itemId, 1, uniqueId);
    
    // 如果添加成功，保存装备映射信息到本地文件
    if (success) {
      this.registerEquipmentLocally(playerId, itemId, uniqueId);
    }
    
    return success ? uniqueId : null;
  }

  // 本地注册装备信息
  private registerEquipmentLocally(playerId: string, itemId: string, uniqueId: string): void {
    try {
      const itemInfo = this.goodsData.find(item => item.id === itemId);
      
      // 使用EquipmentMappingManager注册装备
      EquipmentMappingManager.registerEquipment(playerId, itemId, {
        name: itemInfo?.name || '未知装备',
        type: itemInfo?.type || '未知类型',
        quality: itemInfo?.quality || '白'
      });
      
    } catch (error) {
      console.error('本地注册装备失败:', error);
    }
  }
}

// 导出单例实例
export const bagManager = new BagManager();